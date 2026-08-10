# Reprise apres sinistre — reconstruire le showroom depuis zero

Ce document part du pire cas : **la VM Oracle n'existe plus**. Avec elle
disparaissent le cluster, Gitea, et donc les depots. Tout ce qui suit doit donc
etre executable depuis une machine exterieure, avec pour seules dependances
GitHub, OCI et Porkbun.

Duree constatee de bout en bout : **45 a 60 minutes**, dont l'essentiel en
attente (emission du certificat Let's Encrypt, demarrage de Prometheus).

---

## Ce qu'il faut avoir sous la main

| | Ou |
|---|---|
| Cle API OCI + empreinte | `~/.oci/config` — **a garder hors du serveur** |
| Cle privee SSH | votre poste |
| Acces Porkbun | gestion DNS de `khalilaliouich.com` |
| Ce depot | `github.com/kaliouich/showroom` |
| Les sauvegardes | bucket OCI `showroom-backups` |

> Si la cle API OCI n'existe que sur le serveur mort, rien de ce qui suit ne
> fonctionne. Verifiez-le maintenant, pas le jour de l'incident.

---

## Etape 1 — L'infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # completer
terraform init
terraform apply
```

Terraform cree le VCN, le sous-reseau public, la passerelle Internet, la table
de routage, la security list, l'instance ARM 4 OCPU / 24 Go / 190 Go, et une
**IP publique reservee**.

### Pourquoi l'IP reservee change tout

Le serveur actuel tourne avec une IP **ephemere** (`88.96.58.76`). Si l'instance
est detruite, cette IP est perdue definitivement. Il faudrait alors reprendre
**douze enregistrements DNS** chez Porkbun a la main, puis attendre la
propagation — en pleine reprise d'incident.

Le Terraform provisionne une IP reservee. Elle survit a la destruction de
l'instance : le DNS ne sera plus jamais a retoucher.

`terraform output dns_records_a_creer` affiche les enregistrements a poser.

---

## Etape 2 — Le DNS, avant tout le reste

Chez Porkbun, pointer sur l'IP sortie a l'etape 1 :

```
@  www  git  argocd  grafana  prometheus  demo  status  n8n  linkerd  habits  showcase
```

**A faire avant l'etape 3.** Le certificat est emis par challenge HTTP-01 :
Let's Encrypt doit joindre le domaine sur l'IP. Si le DNS n'est pas propage,
l'emission echoue et cert-manager entre en backoff exponentiel — vous
attendrez alors bien plus longtemps qu'en ayant pris cinq minutes ici.

Verifier : `dig +short khalilaliouich.com` doit renvoyer la nouvelle IP.

---

## Etape 3 — La plateforme

cloud-init a deja installe k3s pendant que vous configuriez le DNS.

```bash
ssh ubuntu@<IP>
sudo tail -f /var/log/bootstrap.log     # attendre "k3s pret"
sudo /opt/showroom/infra/bootstrap/install-platform.sh
```

Le script pose, dans cet ordre : les CRD Gateway API, cert-manager, Envoy
Gateway, la Gateway et le ClusterIssuer, Linkerd, ArgoCD, kube-prometheus,
Loki, Kyverno, Trivy, Gitea, les LimitRange, puis le site.

Les versions sont **figees** a celles relevees en production le 2026-08-10. Une
reprise d'incident n'est pas le moment de decouvrir qu'un chart a change de
schema.

---

## Etape 4 — Les donnees

```bash
sudo /opt/showroom/infra/bootstrap/restore-from-backup.sh
```

Prend la sauvegarde la plus recente du bucket et restaure : les volumes
`local-path`, les donnees Grafana, les trois bases PostgreSQL, et les secrets
du cluster (mots de passe ArgoCD et Gitea, cles de session).

Le script arrete les pods concernes avant de copier : restaurer sous un
PostgreSQL vivant produirait une base incoherente.

---

## Etape 5 — Verifier

```bash
kubectl get pods -A | grep -v Running
kubectl get certificate -A                  # doit finir a True
for h in "" git. argocd. grafana. demo. status. n8n.; do
  echo -n "$h: "; curl -s -o /dev/null -w "%{http_code}\n" "https://${h}khalilaliouich.com/"
done
```

Puis, dans l'ordre : ouvrir Gitea et verifier que les depots sont la, se
connecter a ArgoCD, ouvrir Grafana.

---

## Trois pieges qui coutent cher

### 1. Les drapeaux cloud-provider de k3s

L'ancien serveur tournait avec :

```
--disable-cloud-controller
--kubelet-arg=cloud-provider=external
--kubelet-arg=provider-id=oci://...
```

Ils ne se justifiaient que par le controleur cloud OCI, **desinstalle depuis**.
Les reprendre poserait sur le noeud le taint
`node.cloudprovider.kubernetes.io/uninitialized`, que plus rien ne viendrait
retirer : aucun pod ne se planifierait. Le cluster paraitrait sain tout en
etant inerte, et le diagnostic prend du temps.

`cloud-init.yaml` les omet volontairement. **Ne les remettez pas.**

### 2. Linkerd et ArgoCD

ArgoCD s'appuie sur gRPC entre son serveur, son repo-server et son controller.
Le proxy Linkerd intercepte ce trafic et casse les handshakes TLS : ArgoCD
devient totalement inaccessible.

`install-platform.sh` annote le namespace `argocd` avec
`linkerd.io/inject=disabled` **avant** d'installer ArgoCD. Incident deja vecu,
documente sur la page « Technical Issues Resolved » du site.

### 3. Le pare-feu d'Ubuntu sur OCI

L'image Ubuntu d'Oracle arrive avec un `iptables` qui rejette tout sauf SSH.
Autoriser 80 et 443 dans la security list ne suffit pas : il faut aussi ouvrir
localement. `cloud-init.yaml` s'en charge.

Symptome si oublie : les security lists semblent correctes, et pourtant rien
ne repond sur 80/443.

---

## Ce qui n'est pas automatise

**Le DNS.** Porkbun n'a pas de provider Terraform officiel et les identifiants
ne sont pas dans OCI. Etape manuelle, une seule fois grace a l'IP reservee.

**Les depots Gitea.** Ils reviennent par la restauration (volumes + dump), pas
par une reinstallation. Sans sauvegarde valide, ils sont perdus — c'est la
raison d'etre de `scripts/backup-cluster.sh`.

**Le certificat TLS.** Il est reemis par Let's Encrypt, pas restaure. C'est
volontaire : la cle privee n'a rien a faire dans une sauvegarde, et l'incident
de juillet a montre ce que coute une cle qui circule.

**Le contenu de n8n.** Ses workflows sont dans sa base ; verifier apres
restauration.

---

## La verification que personne ne fait

Une sauvegarde jamais restauree n'est pas une sauvegarde.

Deux fois par an, montez une VM jetable avec ce Terraform, sur un sous-domaine
de test, et deroulez la procedure en entier. C'est le seul moyen de savoir que
ce document est encore juste.

Etat actuel du dispositif :

- sauvegarde quotidienne a 03h17 UTC, timer systemd
- une seule archive conservee, purgee apres envoi reussi
- derniere archive verifiee le 2026-08-10 : 166 Mo, `integrity_check ok`,
  112 tables dans le dump Gitea
