# 🚀 Contexte du Projet : DevOps Showcase & Tamagotchi as a Service

> **Note à l'attention de l'IA** : Ce fichier contient l'intégralité de l'historique du projet, l'architecture, les choix techniques, les étapes réalisées et les problèmes surmontés. Utilise-le comme contexte principal pour toute nouvelle demande de modification ou d'ajout.

## 🎯 1. Objectif Initial (Demandes de l'utilisateur)
L'utilisateur (Khalil Aliouich, Ingénieur DevOps) souhaitait créer l'**ultime site vitrine de DevOps** hébergé sur une VM Oracle Cloud "Always Free" (ARM Ampere A1, 4 OCPUs, 24GB RAM).
Les demandes clés étaient :
- Un cluster Kubernetes complet (K3s).
- **API Gateway**: Envoy Gateway (Gateway API)
- **Monitoring**: Prometheus, Grafana, Loki, Gitea (en remplacement de GitLab jugé trop lourd).
- Une **application de démo interactive** ("Tamagotchi as a Service" - architecture 3-tiers) générant des métriques personnalisées dans Prometheus et affichées dans Grafana.
- Un portail/site web "WOW" (dark mode, glassmorphism) permettant aux visiteurs d'accéder à ArgoCD, Gitea, Grafana et l'app Démo.
- Un système de **Read-Only / Lecture seule** pour les visiteurs afin de sécuriser l'infrastructure (seul l'admin peut modifier).
- Un nom de domaine personnalisé (`khalilaliouich.com`) pointant sur l'IP publique de la VM.

---

## 🏗️ 2. Architecture Technique Déployée

### Infrastructure de Base (Phase 1)
- **OS** : Ubuntu 24.04 ARM64 (sans interface graphique).
- **Orchestrateur** : K3s (v1.36) installé sans Traefik.
- **Réseau & Routing** : Helm, Envoy Gateway (Gateway API), Cert-Manager.
- **DNS** : Wildcard `*.khalilaliouich.com`.

### Plateforme & Outillage DevOps (Phase 2)
- **Git** : Gitea (Léger, parfait pour ARM) avec stockage persistant `oci-bv`.
- **GitOps** : ArgoCD.
- **Monitoring** : Kube-Prometheus-Stack (Prometheus + Grafana). Grafana est désormais configuré avec un stockage persistant local (`hostPath: /var/lib/showcase/grafana-data`) pour conserver les modifications manuelles.
- **Statut / Uptime** : Uptime Kuma déployé pour surveiller les endpoints externes (`https://status.khalilaliouich.com/status/default`).
- **Logging** : Loki + Promtail (Logs des pods aggrégés dans Grafana).

### Démo "Tamagotchi as a Service" 🐣 (Phase 3)
- **Concept** : Des pods Kubernetes représentant des créatures virtuelles. Si la jauge de faim descend à zéro, la créature meurt.
- **Frontend** : React/Vanilla JS servi par Nginx.
- **Backend API** : Node.js (Express) exposant des métriques Prometheus sur le port `8080/metrics`.
- **Base de données** : PostgreSQL.
- **Métriques Custom** : `tamagotchi_hunger_level`, `tamagotchi_happiness_score`, `tamagotchi_creatures_alive_total`, etc.

### Site Vitrine / Portail Web (Phase 4 & Améliorations)
- **Design** : HTML/CSS/JS (Vanilla, pas de framework lourd). Upgrade complet vers un design "Glassmorphism Premium" avec thème Cyberpunk/Neon (Cyan, Magenta, Purple).
- **Fonctionnalités** : Animations fluides, gradients dynamiques, layout Flexbox.
- **Backend / Live Data** : L'ancien serveur statique Nginx a été remplacé par un **Backend Node.js**.
  - Un `ServiceAccount` et un `ClusterRoleBinding` Kubernetes dédiés permettent au backend d'interroger l'API Kubernetes en lecture seule.
  - Le frontend affiche désormais les **métriques réelles** du cluster en direct (Pods, Namespaces, etc.) via le endpoint `/api/infra`.

### Sécurité & Accès (Phase 5)
- **ArgoCD** : Compte visiteur configuré (`guest` / `visitor2026`) avec RBAC `role:readonly`.
- **ClusterRole** : Création d'un rôle Kubernetes `visitor-readonly` (Get/List/Watch uniquement) et génération d'un token ServiceAccount.

### Masterclass DevOps Expansion (Phase 6)
- **Gitea Actions** : Moteur de CI natif et léger, 100% compatible avec la syntaxe GitHub Actions (Remplace Woodpecker).
- **SonarQube (DevSecOps & SAST)** : Intégration avancée d'un serveur d'analyse statique de code (Static Application Security Testing).
  - **Rôle** : Scanne automatiquement le code source (via Gitea Actions) pour détecter les bugs, les vulnérabilités de sécurité (OWASP Top 10), les "Code Smells" (dette technique) et évaluer la qualité logicielle (Clean Code).
  - **Optimisation Extreme (ARM64)** : Fait rarissime sur une infrastructure Cloud Free Tier, SonarQube tourne via des images Docker optimisées avec des restrictions strictes sur la JVM (Java Virtual Machine) d'Elasticsearch et du Compute Engine, garantissant des analyses complexes sans "OOMKilled".
- **Linkerd** : Service Mesh injecté dans les pods de l'application Tamagotchi pour la sécurité (mTLS) et l'observabilité.
- **Trivy Operator & Kyverno** : Scanner de vulnérabilités et moteur de politiques (Policy-as-Code) fonctionnant en arrière-plan.

---

## 🚧 3. Problèmes Rencontrés & Solutions Apportées

1. **Plantage du script Terraform initial (Parsing des logs)**
   - *Problème* : L'agent IA n'arrivait pas à parser les logs Terraform à cause des caractères ANSI (couleurs).
   - *Solution* : Ajout du flag `-no-color` dans la commande `terraform apply`.

2. **Ressources limitées de la VM gratuite (GitLab vs Gitea)**
   - *Problème* : L'utilisateur voulait GitLab, mais l'instance OCI Free Tier (24GB RAM) aurait été surchargée et lente avec Kubernetes + GitLab + Stack Monitoring.
   - *Solution* : Choix d'installer **Gitea**, beaucoup plus léger, performant sur ARM, et suffisant pour du GitOps avec ArgoCD.

3. **Build des images Docker sur le cluster K3s**
   - *Problème* : Docker n'est pas installé par défaut avec K3s, qui utilise `containerd`.
   - *Solution* : Utilisation de `nerdctl` et `buildkit` directement branchés sur le socket `containerd` de K3s pour builder les images Node.js et Nginx du Tamagotchi localement sur la VM.

4. **ServiceMonitor Prometheus introuvable**
   - *Problème* : Prometheus ne scrapait pas les métriques custom de l'API Node.js du Tamagotchi.
   - *Solution* : Le port dans le K8s `Service` n'avait pas de nom. Le service a été mis à jour pour nommer le port `http-api`, et le `ServiceMonitor` a été corrigé pour utiliser ce port spécifique au lieu d'un numéro strict.

5. **Clonage / Push Git lors de l'automatisation**
   - *Problème* : Le script tentait de pousser le code du Tamagotchi vers le service local `gitea-http`, mais c'était un service "Headless" (`ClusterIP: None`), donc injoignable directement par son DNS interne classique depuis le host.
   - *Solution* : Le push du code source a été re-routé via l'URL publique de l'HTTPRoute/Gateway Nginx (`http://git.khalilaliouich.com`).

6. **Connexion réseau externe bloquée (Ports 80/443)**
   - *Problème* : Les sites web déployés (showcase, argocd, grafana) n'étaient pas accessibles depuis l'extérieur (Time Out).
   - *Solution* : Les ports HTTP(80) et HTTPS(443) ont été ouverts à deux endroits de la configuration de sécurité :
     1. Sur la VM elle-même via `iptables` (`sudo iptables -I INPUT ...`).
     2. Sur la console Oracle Cloud dans la "Default Security List" du VCN.

7. **GitOps Automation (ArgoCD vers Gitea)**
   - *Problème* : Il fallait qu'ArgoCD gère automatiquement le déploiement.
   - *Solution* : Déploiement d'une resource `Application` dans ArgoCD pointant vers l'URL Gitea avec l'option `syncPolicy: automated` configurée sur `selfHeal: true` et `prune: true`.

8. **Gitea Actions CI/CD Pipeline & MTU/NAT Network Issues**
   - *Problème* : Les jobs CI (`alpine/git`, `docker`, `node`) n'arrivaient pas à interroger l'API Kubernetes ou le registre Docker à cause de problèmes de fragmentation MTU et de NAT en réseau bridge Docker interne.
   - *Solution* : Configuration du `act-runner` Gitea pour forcer `container.network: host` sur tous les jobs, permettant aux conteneurs CI d'hériter de la pile réseau de la VM (K3s). L'authentification `docker login` a été routée en interne via `gitea-http.gitea.svc.cluster.local:3000`.

9. **GitOps Manifest Update Auth & ImagePullPolicy**
   - *Problème* : La pipeline CI n'arrivait pas à pousser les modifications du fichier `k8s.yaml` vers Gitea, et les Worker nodes K3s ne tiraient pas la nouvelle image construite.
   - *Solution* : Injection d'un token d'accès dans l'URL Git (`https://x-access-token:...`) pour autoriser le `git push`. La politique d'image a été passée à `imagePullPolicy: Always` avec le domaine externe du registre (`git.khalilaliouich.com`) pour s'assurer que K3s télécharge systématiquement la dernière image.

10. **ArgoCD inaccessible (502/Connection Refused) avec Linkerd**
    - *Problème* : L'interface web et l'API d'ArgoCD plantaient car le proxy sidecar `linkerd` interceptait et cassait le trafic gRPC/TLS interne d'ArgoCD.
    - *Solution* : Désactivation de l'injection Linkerd sur le namespace `argocd` (`linkerd.io/inject: disabled`) et redémarrage des contrôleurs.

11. **UI Translation Race Condition (Bug d'affichage i18n)**
    - *Problème* : Le site affichait occasionnellement les clés brutes (`issues_title`) au lieu du texte traduit lors du changement de langue, écrasant le HTML statique.
    - *Solution* : Ajout des clés manquantes dans les dictionnaires `en` et `fr` du fichier `app.js`.

12. **Build Docker "invisible" pour K3s (`ErrImageNeverPull`)**
    - *Problème* : Après avoir recompilé l'image `showcase-website:v37` localement, le déploiement Kubernetes échouait en disant que l'image n'existait pas localement (`ErrImageNeverPull`).
    - *Solution* : L'image avait été construite dans le socket containerd standard (Docker). Pour que K3s la voie, la commande a dû être relancée en ciblant spécifiquement le socket de K3s : `sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build ...`.

13. **Blocage indéfini des `git commit` (GPG Signing)**
    - *Problème* : Les tentatives de commits Git tournaient dans le vide car la configuration globale exigeait une signature GPG (`commit.gpgsign=true`), attendant silencieusement une passphrase.
    - *Solution* : Ajout de l'argument `--no-gpg-sign` pour forcer la validation du commit automatisé.

11. **Site Vitrine 502 Bad Gateway (Nginx vs Node.js)**
    - *Problème* : Lors de la mise à jour CSS, l'image Docker a été reconstruite avec un ancien `Dockerfile` (basé sur Nginx, port 80), alors que l'architecture Kubernetes s'attendait au backend Node.js (port 3000).
    - *Solution* : Transfert du `server.js` et du `Dockerfile` Node.js mis à jour vers la VM, puis rebuild de l'image. Le site a été restauré avec ses capacités de dashboard Live.

12. **ArgoCD Credentials "Guest" & UI CSS Alignment**
    - *Problème* : ArgoCD n'acceptait pas les identifiants visiteur, et les cartes du site vitrine n'étaient pas centrées.
    - *Solution* : Le hash bcrypt du mot de passe `<YOUR_GUEST_PASSWORD>` a été généré manuellement et patché dans le Secret `argocd-secret`. La grille CSS a été transformée de `CSS Grid` vers `Flexbox` (`justify-content: center`) pour un alignement symétrique parfait.

13. **Nettoyage Ingress & Persistence Grafana**
    - *Problème* : Des anciens objets Ingress Nginx traînaient en parallèle de la nouvelle Gateway API. De plus, Grafana perdait ses données (emptyDir) lors des redémarrages.
    - *Solution* : Suppression des Ingress fantômes (`kube-prometheus-grafana`, etc.) pour ne garder que les `HTTPRoute` d'Envoy Gateway. Mise à niveau du Helm Chart Prometheus pour lier Grafana à un PVC (`hostPath` sur `/var/lib/showcase/grafana-data`). Les anciennes images Docker ont également été purgées (`nerdctl image prune -a`) pour libérer l'espace disque.

---

## 🔗 4. Mémento des Liens & Identifiants

- IP Serveur : `<YOUR_VM_IP>`
- **Site Vitrine** : [http://showcase.khalilaliouich.com](http://showcase.khalilaliouich.com)
  - Secret "Admin" du site : `<YOUR_DEMO_SECRET>`
- **Tamagotchi App** : [http://demo.khalilaliouich.com](http://demo.khalilaliouich.com)
- **ArgoCD** : [https://argocd.khalilaliouich.com](https://argocd.khalilaliouich.com)
  - Utilisateur / Mdp : `guest` / `<YOUR_GUEST_PASSWORD>`
- **Grafana** : [http://grafana.khalilaliouich.com](http://grafana.khalilaliouich.com)
  - Utilisateur / Mdp : `admin` / `<YOUR_ADMIN_PASSWORD>`
- **Gitea** : [http://git.khalilaliouich.com](http://git.khalilaliouich.com)
  - Utilisateur / Mdp : `khalil` / `<YOUR_ADMIN_PASSWORD>`
- **Prometheus** : [http://prometheus.khalilaliouich.com](http://prometheus.khalilaliouich.com) (Accès libre)
- **SonarQube** : [http://sonar.khalilaliouich.com](http://sonar.khalilaliouich.com) (admin / <YOUR_ADMIN_PASSWORD>)
- **Linkerd Viz** : [http://linkerd.khalilaliouich.com](http://linkerd.khalilaliouich.com)

---

## 📂 5. Arborescence du Projet Physique (`/data/homes/kah/work_numodata/oci-provisioning/showcase/`)

- `scripts/` : Contient les scripts bash d'installation (`bootstrap.sh`, `phase2-platform.sh`, `phase3-tamagotchi.sh`, `phase4-website.sh`).
- `k8s/` : Contient les manifestes YAML Kubernetes.
  - `rbac/` : Roles et ServiceAccounts.
  - `tamagotchi/` : Manifestes applicatifs de la démo.
- `tamagotchi/` : Code source de l'application (Désormais poussé sur Gitea).
  - `api/` : Code Node.js
  - `frontend/` : Fichiers HTML/CSS/JS.
- `website/` : Fichiers statiques HTML/JS du site vitrine principal.
