# Showroom DevOps — contexte du projet

> Mis à jour le 2026-08-10. Ce document décrit l'état réel de la plateforme et
> la façon dont elle se reconstruit. Il sert de contexte principal pour toute
> intervention.

## Ce que c'est

Une vitrine DevOps qui ne raconte pas ce qu'elle sait faire : elle le montre.
Un cluster Kubernetes en production, ouvert au public, sur une VM ARM Oracle
Cloud du palier gratuit. Les dashboards, les métriques, les pods, la pipeline
GitOps — tout est consultable en direct sur [khalilaliouich.com](https://khalilaliouich.com).

L'objectif est commercial : un prospect peut vérifier chaque affirmation en
cliquant, plutôt que de croire un CV.

## Infrastructure

| | |
|---|---|
| Hébergeur | Oracle Cloud, région `eu-paris-1`, palier Always Free |
| Machine | `VM.Standard.A1.Flex` — 4 OCPU ARM, 24 Go RAM, 190 Go |
| Kubernetes | K3s `v1.36.2+k3s1`, nœud unique |
| Réseau | VCN 10.0.0.0/16, sous-réseau public, Internet Gateway |
| Entrée | Envoy Gateway (Gateway API), TLS Let's Encrypt via cert-manager |
| DNS | Porkbun, 12 enregistrements A |

## Composants

**Plateforme** — ArgoCD `v3.4.4` (GitOps), Gitea `1.26.1` (forge Git et
registre), Linkerd `edge-26.6.3` (service mesh), Kyverno `v1.18.1`
(politiques), Trivy Operator (analyse de vulnérabilités).

**Observabilité** — kube-prometheus-stack `87.10.1` (Prometheus, Grafana,
Alertmanager), Loki `2.9.3` avec Promtail, Uptime Kuma pour la surveillance
externe.

**Applications** — le site vitrine (Node.js/Express, métriques du cluster lues
depuis l'API Kubernetes et Prometheus), Tamagotchi as a Service (démo 3-tiers
générant des métriques Prometheus personnalisées), n8n (automatisation),
Habit Game.

État courant : 52 pods, 16 namespaces, 68 services.

## Déploiement

Toute la plateforme est déclarée en code, en deux couches à la frontière
nette : Terraform s'arrête où finit l'API Oracle, Ansible possède tout ce qui
vit dans la machine et dans le cluster.

**`infra/terraform/`** — la couche Oracle Cloud : VCN, sous-réseau, Internet
Gateway, table de routage, security list, instance ARM, et une **IP publique
réservée** pour que le DNS n'ait jamais à être retouché. cloud-init n'installe
plus que `git` et `ansible` — k3s, le pare-feu et les paquets appartenaient ici
avant, en double avec les rôles Ansible, et ont été retirés le 2026-08-11.

**`infra/ansible/`** — la couche cluster, en 5 rôles : `base` (paquets,
pare-feu), `k3s`, `platform` (CRD Gateway API, cert-manager, Envoy Gateway, la
Gateway et le ClusterIssuer, Linkerd, ArgoCD, kube-prometheus, Loki, Kyverno,
Trivy, Gitea, les LimitRange), `apps` (le site, Tamagotchi, n8n, les routes
HTTP), `backup`. Contrairement à Terraform, il est idempotent et se rejoue sur
un cluster existant pour corriger une dérive. Les valeurs Helm sont des
fichiers versionnés (`infra/ansible/group_vars/all.yml`) plutôt qu'enfouies
dans l'état d'une release.

Les versions sont figées, pas flottantes : une reprise d'incident n'est pas le
moment de découvrir qu'un chart a changé de schéma de valeurs.

```bash
cd infra/terraform && terraform apply                          # infrastructure

cd ../ansible && ansible-galaxy collection install -r requirements.yml
sudo ansible-playbook -i localhost, -c local site.yml           # plateforme
```

Reconstruction complète depuis zéro : 45 à 60 minutes, dont l'essentiel en
attente (émission du certificat, démarrage de Prometheus). Procédure détaillée
dans [`infra/DISASTER-RECOVERY.md`](infra/DISASTER-RECOVERY.md).

## Exploitation

**Sauvegardes** — quotidiennes à 03h17 UTC par timer systemd. L'archive
contient la base K3s (copie SQLite cohérente), les dumps PostgreSQL de Gitea,
Tamagotchi et Habit Game, les volumes `local-path`, et l'ensemble des
manifestes. Envoi vers OCI Object Storage, hors du nœud. Une seule archive est
conservée, et la purge n'a lieu qu'après un envoi réussi : un échec ne détruit
jamais la sauvegarde précédente.

**Ressources** — tous les conteneurs ont des limites, via `LimitRange` par
namespace dimensionnés sur les pics observés. Sur un nœud unique, un pod qui
fuit ne doit pas pouvoir emporter la machine.

**Sécurité** — le conteneur du site tourne en utilisateur non privilégié avec
un système de fichiers en lecture seule et toutes les capabilities retirées.
Son ServiceAccount ne peut pas lire les secrets. Un hook pre-commit refuse tout
commit contenant une clé, un certificat, un token ou une archive binaire.

## Pièges connus

Trois comportements qui ont coûté cher et qui sont désormais neutralisés dans
le code. Ils sont documentés parce qu'ils se reproduiraient sur toute
plateforme comparable.

**Les drapeaux cloud-provider de K3s.** `--kubelet-arg=cloud-provider=external`
sans contrôleur cloud actif marque le nœud `uninitialized` : plus rien ne se
planifie, alors que le cluster paraît sain.

**Linkerd et ArgoCD.** Le proxy intercepte le gRPC interne d'ArgoCD et casse
les handshakes TLS. Le namespace doit porter `linkerd.io/inject=disabled`
avant l'installation.

**L'état de cluster sur `emptyDir`.** Valkey y stockait son `nodes.conf` :
chaque recréation de pod lui faisait perdre son identité, cassait le cluster et
mettait Gitea à terre. Corrigé par un PVC — voir
[`k8s/RUNBOOK-valkey.md`](k8s/RUNBOOK-valkey.md).

## Structure du dépôt

```
website/          le site vitrine (Node.js, i18n FR/EN)
tamagotchi/       l'application de démonstration
k8s/              manifestes : RBAC, LimitRange, applications, runbooks
infra/terraform/  couche Oracle Cloud
infra/ansible/    couche Kubernetes, 5 rôles
infra/bootstrap/  cloud-init, installation shell de secours, restauration
infra/DISASTER-RECOVERY.md
scripts/          sauvegarde, détection de secrets
.github/workflows/ci.yml  scan de secrets, build + Trivy, validation kubeconform
```
