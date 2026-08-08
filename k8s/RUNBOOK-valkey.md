# Valkey (sessions Gitea) — incident du 2026-08-08 et correctif

## Ce qui s'est passé

Un `rollout restart` du namespace `gitea` a fait tomber Gitea (502 puis 500)
pendant une trentaine de minutes.

Le StatefulSet `gitea-valkey-cluster` stockait son etat de cluster
(`nodes.conf`, dans `/bitnami/valkey/data`) sur un **`emptyDir`**. A chaque
recreation d'un pod, le noeud perdait donc son identite de cluster **et**
changeait d'IP. Les deux autres noeuds continuaient de chercher l'ancienne IP,
la marquaient `master,fail`, et les 5461 slots qu'elle portait devenaient
injoignables : `cluster_state:fail`.

Gitea utilise Valkey pour ses sessions (`MustInitSessioner`). Cluster en echec
= Gitea en CrashLoopBackOff.

La cause etait dormante depuis l'installation : n'importe quel redemarrage de
pod, une eviction ou un reboot du noeud aurait produit le meme resultat.

## Le correctif applique

`volumeClaimTemplates` etant immuable, le StatefulSet a ete recree :

1. `kubectl delete sts --cascade=orphan` (les pods restent en vie)
2. re-creation depuis [gitea-valkey/statefulset.yaml](gitea-valkey/statefulset.yaml),
   ou `valkey-data` est un **PVC de 1 Gi par noeud** (`local-path`) au lieu d'un
   `emptyDir`
3. suppression des trois pods pour qu'ils reviennent avec leur PVC
4. le chart a reforme le cluster automatiquement au demarrage

A noter : l'adoption de pods orphelins ne declenche pas leur recreation. Ils
gardent le label `controller-revision-hash` de l'ancien StatefulSet, et le
controleur tente alors un patch en place qui est interdit (`FailedUpdate`), ce
qui bloque toute la boucle de reconciliation. Il faut supprimer les pods a la
main.

## Verification

Le test qui prouve que c'est repare — supprimer un pod et comparer son
identite de cluster avant/apres :

```bash
sudo kubectl exec -n gitea gitea-valkey-cluster-2 -c gitea-valkey-cluster -- valkey-cli cluster myid
sudo kubectl delete pod gitea-valkey-cluster-2 -n gitea
# attendre le retour du pod, puis re-executer cluster myid
```

Resultat obtenu le 2026-08-08 : identite `b1830d13...` conservee, IP passee de
`10.42.0.14` a `10.42.0.16`, cluster reste en `cluster_state:ok`, Gitea intact.
Le gossip met l'IP a jour tout seul des lors que l'identite du noeud survit.

## Si le cluster casse quand meme

[gitea-valkey/repair-node.sh](gitea-valkey/repair-node.sh) reintegre un noeud
dont l'identite a ete perdue :

```bash
sudo ./k8s/gitea-valkey/repair-node.sh 2
```

Il fait rejoindre le noeud, purge l'ancienne identite sur les trois membres
(imperativement dans la meme minute, sinon le gossip la reapprend) et lui rend
ses slots. Verifier ensuite `cluster_state:ok` et `cluster_slots_ok:16384`.

Les donnees Valkey restent de toute facon jetables : ce ne sont que des
sessions, les utilisateurs sont simplement deconnectes.

## Reste a faire

Le PDB `gitea-valkey-cluster` remonte `UnmanagedPods` et ne sait pas calculer
son statut. Il faudrait lui fixer un `minAvailable` entier.
