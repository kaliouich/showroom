# 🎓 Le Guide Ultime : Sous le Capot du Cluster DevOps Showcase

Ce document est le guide d'apprentissage technique définitif pour ce cluster. Il n'explique pas seulement *ce* qui est utilisé, mais **comment cela fonctionne sous le capot**, comment les composants sont installés, et comment ils communiquent entre eux au niveau réseau et système.

---

## ⚙️ 1. L'Exécution : K3s et Containerd (Le Moteur)

Beaucoup pensent à tort que Kubernetes "fait tourner des conteneurs". C'est faux. Kubernetes est un orchestrateur ; il donne des ordres à un **Container Runtime**.

### Qu'est-ce que Containerd ?
Sur ce cluster, Docker n'est pas installé. Le runtime utilisé est **Containerd**. 
- **Comment ça marche ?** Containerd est une implémentation du standard CRI (Container Runtime Interface). Quand Kubernetes veut démarrer un pod, il parle à Containerd via gRPC. Containerd télécharge l'image depuis la registry, la décompresse, et utilise un outil très bas niveau appelé `runc` pour créer les `namespaces` et `cgroups` Linux. C'est ce qui crée l'isolation du conteneur.
- **Pourquoi ?** C'est beaucoup plus léger et consomme moins de RAM et de CPU que le gros démon Docker, un atout vital sur notre machine ARM64.

### L'installation de K3s
K3s a été installé via un script bash fourni par Rancher. Lors de l'installation, le paramètre `--disable traefik` a été utilisé. Pourquoi ? K3s installe Traefik par défaut comme contrôleur réseau, mais nous l'avons désactivé pour utiliser une technologie réseau plus moderne (Envoy Gateway).

---

## 🔄 2. La Mécanique d'Installation et GitOps

Comment les applications sont-elles arrivées sur ce cluster ? Rien n'a été cliqué manuellement.

1. **Le Bootstrapping (ArgoCD)** : ArgoCD a été installé manuellement (via des `kubectl apply -f install.yaml` de base) pour servir d'amorçage. 
2. **L'installation via Helm** : Gitea et la stack Prometheus sont installés via **Helm**, le gestionnaire de paquets de Kubernetes. Helm regroupe des milliers de lignes de YAML en un "Chart" paramétrable.
3. **Le flux GitOps (La communication ArgoCD -> Gitea -> K8s)** :
   - ArgoCD scrute en permanence les dépôts Git sur Gitea via des requêtes HTTPS ou SSH.
   - Il lit les fichiers de configuration (Helm ou YAML bruts).
   - Il interroge la base de données interne de Kubernetes (`etcd`) via le `kube-apiserver` pour connaître l'état actuel.
   - S'il y a une différence (Drift), ArgoCD exécute les appels API (POST/PUT) vers le `kube-apiserver` pour créer ou modifier les ressources (Pods, Services, Ingress).

---

## 🕸️ 3. Réseau Avancé : Envoy Gateway & Service Mesh

### Gateway API (Routage Nord-Sud)
L'ancien modèle "Ingress" est mort. Ce cluster utilise la **Kubernetes Gateway API**.
- L'installation d'Envoy Gateway déploie un contrôleur (GatewayClass `eg`).
- Lorsqu'on crée un objet `Gateway`, le contrôleur "spin up" (crée) de vrais pods **Envoy Proxy**.
- Lorsqu'on crée une `HTTPRoute` (ex: pour `grafana.khalilaliouich.com`), Envoy met à jour sa configuration interne dynamiquement (sans redémarrer) pour écouter ce nom de domaine, et transférer les paquets TCP vers l'IP interne (`ClusterIP`) du Service Grafana.

### Linkerd : Le Service Mesh au Microscope (Réseau Est-Ouest)
Que fait *exactement* Linkerd ? C'est le concept du **Sidecar**.
- **L'Init Container & iptables** : Quand un pod démarre, Linkerd lance d'abord un conteneur éphémère (`linkerd-init`) en mode privilégié. Ce conteneur modifie les règles de pare-feu Linux (`iptables`) du pod. Il force **tout** le trafic sortant et entrant du pod à passer par un port spécifique (le port du proxy).
- **Le Proxy Rust** : À côté de votre application (ex: l'API Tamagotchi), Linkerd injecte un micro-proxy développé en langage Rust (extrêmement rapide, ~2Mo de RAM).
- **Le Chiffrement (mTLS)** : Quand l'API Tamagotchi veut parler à la base PostgreSQL, elle envoie du trafic HTTP/TCP en clair (non sécurisé). Le proxy Linkerd intercepte ce trafic, vérifie l'identité du composant, chiffre les données en TLS avec des certificats gérés par `linkerd-identity`, et l'envoie au proxy Linkerd du pod PostgreSQL. Ce dernier déchiffre le trafic et le donne à la base de données.
- **Résultat** : Chiffrement de bout en bout et télémétrie ultra précise (le proxy compte les paquets) sans toucher à une ligne de code !

---

## 📊 4. Sous le capot de l'Observabilité (Prometheus & Grafana)

L'observabilité de ce cluster repose sur le `kube-prometheus-stack` (le Prometheus Operator).

### Comment Prometheus "Scrape" (récupère) les données ?
Prometheus ne "reçoit" pas les données, il va les chercher (modèle Pull).
1. L'application Tamagotchi expose une page web brute (un endpoint) sur `/metrics` contenant du texte simple (ex: `tamagotchi_hunger_level 85`).
2. Pour dire à Prometheus d'aller lire cette page, on ne modifie pas le fichier de configuration de Prometheus. On crée un objet K8s appelé **`ServiceMonitor`**.
3. Le **Prometheus Operator** surveille les `ServiceMonitors`. Dès qu'il en voit un, il met à jour la configuration de Prometheus automatiquement.
4. Prometheus va alors faire une requête HTTP GET vers `http://tamagotchi-api:8080/metrics` toutes les 15 secondes. Il compresse ces données textuelles et les stocke dans sa base de données temporelle interne (TSDB).

### Comment Grafana communique avec Prometheus ?
Grafana est une coquille vide, c'est juste une interface de visualisation.
1. Grafana est configuré avec une "Data Source". Cette source pointe vers le nom DNS interne de Kubernetes de Prometheus (ex: `http://kube-prometheus-kube-prome-prometheus.monitoring.svc.cluster.local:9090`).
2. Quand vous ouvrez un Dashboard (ex: CPU de la VM), le backend de Grafana fabrique une requête complexe dans un langage appelé **PromQL** (Prometheus Query Language).
3. Il envoie cette requête PromQL via une API HTTP à Prometheus.
4. Prometheus calcule la courbe mathématique, renvoie les coordonnées JSON à Grafana, et Grafana dessine le graphique dans votre navigateur.

### Et pour les Logs ? (Loki & Promtail)
- **Promtail** est déployé en tant que `DaemonSet` (il y a un pod Promtail sur chaque nœud physique). Promtail a le droit de lire le dossier racine de la VM `/var/log/containers/` où Containerd écrit les logs (sorties standards `stdout/stderr`) de chaque pod.
- Promtail lit ces lignes, y attache des étiquettes Kubernetes (ex: `app=tamagotchi`), et les expédie en flux HTTP POST à **Loki**. Grafana interroge ensuite Loki avec le langage **LogQL**.

---

## ❓ FAQ Technique Avancée

> **Q : Comment K3s résout-il les noms DNS en interne ?**
> **R :** Via **CoreDNS**. Chaque pod K8s a son fichier `/etc/resolv.conf` configuré pour pointer vers le pod CoreDNS. Si le pod Tamagotchi cherche `postgres`, CoreDNS répond avec l'IP interne (`ClusterIP`) du service PostgreSQL (ex: `10.43.x.x`). `kube-proxy` (ou les iptables générées par K3s) route ensuite les paquets vers le bon pod.

> **Q : Comment les images Docker sont-elles construites sur une machine qui n'a pas Docker ?**
> **R :** Le cluster utilise `nerdctl`, un outil CLI compatible avec Docker mais conçu pour Containerd. Couplé avec `buildkit`, nerdctl compile le `Dockerfile`, génère les layers (couches), et enregistre l'image directement dans l'espace de stockage de Containerd sous le namespace `k8s.io`. K3s peut alors utiliser cette image instantanément sans avoir besoin d'un registre externe.

> **Q : Pourquoi le cluster utilise "local-path" pour certaines bases de données ?**
> **R :** `local-path` est un provisionneur CSI minimaliste fourni par K3s. Quand Kubernetes demande un PVC (PersistentVolumeClaim) de 2Go, le provisionneur crée automatiquement un dossier sur le disque physique de la VM (dans `/var/lib/rancher/k3s/storage/`). Kubernetes monte ce dossier à l'intérieur du pod. C'est extrêmement performant en I/O (car c'est le NVMe direct de la VM), mais la donnée ne peut pas migrer sur un autre serveur physique si la VM meurt.
