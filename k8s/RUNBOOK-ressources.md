# Reservations de ressources — audit du 2026-10-26

Le scheduler place les pods d'apres les **requests**, pas l'usage. Le 25 octobre le noeud
etait a 97 % de CPU demande pour environ 50 % utilise : des pods Kafka sont restes Pending
des heures. Cet audit compare ce que chaque conteneur demande a ce qu'il consomme.

## Methode

Usage sur 7 jours, par conteneur (Prometheus) :

```promql
# CPU : p95 sur 7 jours
quantile_over_time(0.95, rate(container_cpu_usage_seconds_total{container!="",container!="POD"}[5m])[7d:5m])
# memoire : pic sur 7 jours
max_over_time(container_memory_working_set_bytes{container!="",container!="POD"}[7d])
```

Deux pieges rencontres :

1. **Les valeurs par defaut des LimitRange** (`k8s/limitranges/`) s'appliquent a tout conteneur sans
   `requests` explicites, y compris les proxys Linkerd et les sidecars. Dans `monitoring`, 16
   conteneurs reservaient chacun 512 Mio / 50 m (8 Gio, 800 m au total).
2. **Les init containers comptent** : le scheduler retient `max(init containers, somme des
   conteneurs)`. Les init containers du chart Gitea demandaient 100 m, ce qui annulait toute baisse
   sur le conteneur principal (`initContainers.resources` dans `k8s/gitea/values.yaml`).
   Les proxys Linkerd sont des sidecars natifs, comptes en plus par le scheduler mais ranges a part par
   kube-state-metrics (voir `k8s/monitoring/platform-alerts.yaml`).

## Corrige le 2026-10-26

| Composant | Avant | Apres | Mesure |
|---|---|---|---|
| LimitRange `monitoring` | 512 Mio / 50 m | 64 Mio / 10 m | 16 conteneurs, quelques dizaines de Mio utilises |
| LimitRange `argocd` | 256 Mio / 25 m | 96 Mio / 10 m | 20 a 120 Mio utilises |
| `argocd-application-controller` | 256 Mio / 25 m | 768 Mio / 50 m | 725 Mio au pic (sous-dimensionne) |
| `viral-worker` | 1 Gio / 500 m | 192 Mio / 10 m | 58 Mio au pic, CPU nul |
| Gitea | 256 Mio / 100 m, limite 512 Mio | 384 Mio / 25 m, limite 768 Mio | pic de 442 Mio : 14 % de marge avant OOM |
| PostgreSQL de Gitea | 100 m | 25 m | p95 de 7 m |
| init containers de Gitea | 128 Mio / 100 m | 64 Mio / 10 m | |

Noeud : 97 % -> 62 % du CPU demande, 88 % -> 62 % de la memoire demandee.

## Reste a faire (demande un redemarrage sensible)

Sur-dimensionne :

- `config-reloader` de Prometheus et d'Alertmanager : 512 Mio chacun pour 15 a 23 Mio utilises.
- `envoy` de la passerelle : 512 Mio / 100 m pour 46 Mio et 2 m ; se regle dans la ressource
  `EnvoyProxy` (coupure breve du site).
- 100 m de CPU pour moins de 10 m : CoreDNS et metrics-server (geres par k3s, revenus a chaque mise
  a jour), PostgreSQL du Tamagotchi, `habit-game` et `habit-postgres` (autre depot), Loki.

Sous-dimensionne (risque d'eviction sous pression memoire, aucune pression aujourd'hui) :

| Conteneur | Demande | Pic 7 j |
|---|---|---|
| Prometheus | 512 Mio | 2,2 Gio |
| n8n | 128 Mio | 584 Mio |
| Grafana | 256 Mio | 505 Mio |
| trivy-operator | 128 Mio | 374 Mio |
| prometheus de linkerd-viz | 128 Mio | 361 Mio |
| strimzi-cluster-operator | 256 Mio | 311 Mio |
| user-operator / topic-operator (Kafka) | 128 Mio | 218 / 188 Mio |

## Garde-fous

`NodeCPURequestsHigh` / `NodeMemoryRequestsHigh` (85 %) et `PodUnschedulable` previennent avant le
blocage (voir `k8s/monitoring/platform-alerts.yaml`).
