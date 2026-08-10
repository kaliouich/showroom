// ============================================================================
// DevOps Showcase — Main Application Logic
// Live K8s data, typewriter, i18n, admin mode, scroll animations
// ============================================================================

const VM_IP = '<YOUR_VM_IP>';
const NIP = 'khalilaliouich.com';
const TAMAGOTCHI_API = `http://demo.${NIP}/api`;
const SHOWCASE_API = window.location.origin;
const DEMO_SECRET = '<YOUR_DEMO_SECRET>';

// ---- i18n ----
const i18n = {
  en: {
    nav_home: 'Home', nav_architecture: 'Architecture', nav_infra: 'Live Infra',
    nav_demo: 'Demo App', nav_tools: 'Tools', nav_admin: '🔐 Admin',
    nav_freelance: '💼 Hire Me',
    hero_badge: 'Live Infrastructure — Oracle Cloud Always Free',
    hero_badge_freelance: 'Freelance — available for your projects',
    hero_title_1: "Hi, I'm", hero_desc: 'This entire infrastructure — Kubernetes cluster, GitOps pipeline, monitoring stack, and demo app — is running live on a single ARM server provisioned for free on Oracle Cloud.',
    hero_cta_explore: '🚀 Explore Live Infrastructure', hero_cta_demo: '🐣 See Demo App',
    hero_cta_hire: '💼 Work With Me',
    arch_badge: 'System Design', arch_title: 'Architecture Overview',
    arch_subtitle: 'A complete DevOps ecosystem running on a single ARM instance',
    arch_infra: 'Infrastructure', arch_platform: 'Platform',
    arch_app: 'Demo App — Tamagotchi as a Service',
    infra_badge: 'Real-time', infra_title: 'Live Infrastructure Status',
    infra_subtitle: 'All data below is fetched live from the Kubernetes API',
    infra_node: 'Cluster Node', infra_pods: 'Running Pods',
    infra_namespaces: 'Namespaces', infra_services: 'Services',
    infra_across: 'across all namespaces', infra_active: 'active namespaces',
    infra_endpoints: 'exposed endpoints', infra_pod_list: 'Pod Status by Namespace',
    live_subtitle: 'Two ways to look at the same running cluster: raw data straight from the Kubernetes API, or the Grafana dashboards it feeds.',
    live_tab_k8s: '☸️ Kubernetes API', live_tab_grafana: '📈 Grafana Dashboards',
    loading: 'Loading...',
    demo_badge: 'Live Demo',
    demo_subtitle_short: 'Virtual creatures living as Kubernetes pods. Feed them or they die — and every action becomes a Prometheus metric.',
    demo_issues_link: '🔧 How I debugged it →',
    demo_subtitle: 'A 3-tier application where virtual creatures live as Kubernetes pods. Feed them or they die! All metrics flow to Prometheus & Grafana in real-time.',
    demo_frontend: 'Frontend', demo_api: 'API Backend', demo_metrics: 'Metrics Pipeline',
    demo_frontend_desc: 'Interactive UI to adopt, feed, play with, and monitor your creatures. Dark theme with real-time stat bars.',
    demo_api_desc: 'Node.js REST API with custom Prometheus metrics: hunger_level, happiness_score, energy_level, feed/play/sleep counters.',
    demo_metrics_desc: 'Custom metrics scraped by Prometheus every 15s, visualized in a dedicated Grafana dashboard with gauges, time series, and alerts.',
    demo_open: 'Open App →', demo_api_btn: 'View API →', demo_grafana: 'Open Grafana →',
    demo_live_title: '🐣 Creature Stats — Live',
    demo_alive: 'Alive', demo_dead: 'Dead', demo_starving: 'Starving',
    demo_avg_hunger: 'Avg Hunger', demo_avg_happy: 'Avg Happiness',
    nav_iac: "⚙️ IaC",
    iac_badge: "Infrastructure as Code",
    iac_title: "This cluster is <span class=\"gradient-text\">rebuildable from zero</span>",
    iac_subtitle: "Every layer is declared as code, and the code is public. If this server disappeared tonight, one <code>terraform apply</code> and one <code>ansible-playbook</code> would bring it all back in under an hour — network, cluster, GitOps, observability, applications and data.",
    iac_tf_scope: "stops where the Oracle API ends",
    iac_tf_desc: "VCN, subnet, internet gateway, route table, security list, the ARM instance, and a <strong>reserved public IP</strong>. Terraform is used for what it does best: cloud resources that have a state, where drift must be detected and a plan reviewed before anything changes.",
    iac_tf_chips: "<span class=\"hire-chip\">VCN &amp; subnet</span><span class=\"hire-chip\">Internet Gateway</span><span class=\"hire-chip\">Security lists</span><span class=\"hire-chip\">Compute ARM A1</span><span class=\"hire-chip\">Reserved IP</span>",
    iac_tf_link: "📂 Read the Terraform →",
    iac_ans_scope: "everything inside the machine and the cluster",
    iac_ans_desc: "Packages, firewall, K3s, Helm releases, manifests, images, backup timer. Ansible is used where Terraform would only have <code>local-exec</code>: it is idempotent, replays on a live cluster to correct drift, and turns Helm values into versioned files instead of leaving them buried in a release's state.",
    iac_ans_chips: "<span class=\"hire-chip\">K3s</span><span class=\"hire-chip\">cert-manager</span><span class=\"hire-chip\">Envoy Gateway</span><span class=\"hire-chip\">ArgoCD</span><span class=\"hire-chip\">Linkerd</span><span class=\"hire-chip\">Prometheus</span><span class=\"hire-chip\">Gitea</span><span class=\"hire-chip\">Backups</span>",
    iac_ans_link: "📂 Read the playbook →",
    iac_dr: "The full recovery procedure — including the three traps that cost me hours: the K3s cloud-provider flags that silently taint the node, Linkerd breaking ArgoCD's internal gRPC, and Oracle's Ubuntu image dropping ports 80 and 443 whatever the security list says.",
    iac_dr_link: "🚨 Disaster recovery runbook",
    iac_repo_link: "🐙 The whole repository",
    tools_badge: 'Toolbox', tools_title: 'DevOps Tools Portal',
    tools_subtitle: 'Access all tools directly. Visitor accounts are read-only for security.',
    tool_argocd: 'GitOps continuous delivery. See application sync status, health, and history.',
    tool_grafana: 'Dashboards for metrics, Tamagotchi stats, and Loki log exploration.',
    tool_prometheus: 'Query raw metrics with PromQL. Explore Tamagotchi custom metrics.',
    tool_gitea: 'Self-hosted Git server. Browse the Tamagotchi source code and K8s manifests.',
    tool_tamagotchi: 'The live 3-tier demo app. Adopt creatures, see metrics flow through the entire stack.',
    tool_readonly: 'Read Only', tool_viewer: 'Viewer', tool_noauth: 'No authentication',
    tool_public: 'Public repos', tool_interactive: 'Interactive!',
    tool_gitea_actions: 'Native Continuous Integration pipeline compatible with GitHub Actions.', tool_sonarqube: 'Static code analysis to detect bugs, vulnerabilities, and code smells.', tool_linkerd: 'Ultralight Service Mesh providing observability, reliability, and security.', tool_public_login: 'Login via Gitea',
    footer_text: 'Built with K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hosted on Oracle Cloud Always Free (ARM Ampere A1).',
    footer_powered: 'Powered by determination & free cloud credits',
    nav_about: '👤 About', nav_back: '← Back to Home',
    issues_badge: 'Troubleshooting', issues_title: 'Technical Issues Resolved', issues_subtitle: 'A deep dive into the engineering challenges faced and overcome while deploying this architecture on Oracle Cloud.',
    issues_hero_badge: 'Deep Dive Post-Mortem', issues_hero_title: 'Technical <span class="gradient-text">Issues Resolved</span>',
    issues_hero_desc: 'An in-depth look at the engineering challenges faced while deploying the microservices architecture on Oracle Cloud (ARM64). Discover the root causes, the exact error logs, and the terminal commands used to fix them.',
    issue_1_title: 'CI/CD Runner Network Isolation (Gitea Actions)',
    issue_1_desc: 'The CI/CD pipeline steps (using Docker containers via <code>act-runner</code>) were failing to execute <code>git clone</code> or push Docker images. The standard Docker bridge network created by <code>act-runner</code> suffered from MTU fragmentation and NAT translation issues when communicating with K3s Pod IPs and Services on this specific Oracle Cloud virtualized network.',
    issue_1_sol: 'We configured the Gitea <code>act-runner</code> to force all CI job containers to run on the host\'s network namespace, allowing ephemeral CI containers to seamlessly resolve <code>.svc.cluster.local</code> domains without NAT overhead.',
    issue_2_title: 'ArgoCD gRPC Interference with Linkerd',
    issue_2_desc: 'ArgoCD became completely inaccessible. The <code>argocd-server</code> logs were filled with TLS handshake failures. The installation of the Linkerd Service Mesh globally injected sidecars into the ArgoCD namespace, which aggressively intercepts gRPC traffic. ArgoCD heavily relies on internal gRPC between its server, repo-server, and application-controller.',
    issue_2_sol: 'We disabled Linkerd proxy injection specifically for the ArgoCD namespace and restarted the controllers to restore internal communication.',
    issue_3_title: 'GitOps Manifest Push Authentication',
    issue_3_desc: 'After successfully building the Docker image, the pipeline failed during the deployment manifest update phase. The default <code>GITHUB_TOKEN</code> injected by Gitea Actions was insufficient for pushing back to the repository within the specific job context over HTTPS.',
    issue_3_sol: 'We modified the <code>.gitea/workflows/deploy.yaml</code> to inject a dedicated access token directly into the remote URL before executing the push.',
    issue_4_title: 'ImagePullPolicy Stale Caching',
    issue_4_desc: 'ArgoCD successfully synced the new <code>k8s.yaml</code> manifest, but the K3s worker nodes refused to pull it. Initially, the registry URL was configured as the internal service <code>gitea-http.gitea.svc.cluster.local:3000</code>. K3s containerd daemon resolves DNS differently than pods and couldn\'t authenticate properly without specific registry mirrors.',
    issue_4_sol: 'We switched the registry target to the external proxy domain and forced strict layer hash validation.',
    issue_5_title: 'ArgoCD RBAC "Guest" Credentials',
    issue_5_desc: 'The showcase website advertised <code>guest</code> / <code><YOUR_GUEST_PASSWORD></code> as the credentials for ArgoCD, but ArgoCD rejected the login despite proper RBAC mapping in the ConfigMap.',
    issue_5_sol: 'We generated a raw bcrypt hash manually via Python and directly patched the <code>argocd-secret</code> to inject the guest password securely.',
    issue_6_title: 'Node.js vs Nginx Port Bindings',
    issue_6_desc: 'A frontend CSS update accidentally reverted the container build to an old Nginx Dockerfile, causing a port mismatch (80 vs 3000) for the live metrics backend since the Kubernetes Service was still routing to 3000.',
    issue_6_sol: 'Restored the <code>server.js</code> Node.js proxy architecture, rebuilt the image via nerdctl, and executed a rolling K8s deployment update with proper ServiceAccount bindings.',
    badge_issue: 'Issue', badge_resolution: 'Resolution',
    issues_connection_refused: 'Connection Refused / Network Unreachable', issues_host_network: 'Host Network Namespace',
    issues_502: '502 Bad Gateway / gRPC Connection Error', issues_disable_sidecar: 'Disable Sidecar Injection',
    issues_context_limit: 'Context Limitations', issues_oauth: 'OAuth Token Injection',
    issues_errimagepull: 'ErrImagePull / Stale Deployments', issues_external_domain: 'External Domain & Always Pull',
    issues_rejected: 'Rejected Login', issues_bcrypt: 'Bcrypt Secret Patching',
    issues_502_port: '502 Bad Gateway', issues_arch_restore: 'Architecture Restoration',
    about_hero_badge: 'Curious mind? Welcome.', about_hero_title: 'Behind the <span class="gradient-text">Architecture</span>',
    about_role: 'Senior DevOps & Platform Engineer', about_desc: '12+ years of experience across Telecom, IoT, Cloud-Native, and Edge Computing. Specializing in highly resilient hybrid-cloud platforms.',
    about_linkedin: '🔗 LinkedIn Profile', about_github: '🐙 GitHub Repositories',
    about_cert_cka: 'Score 85/100 | CNCF / Linux Foundation',
    about_summary_title: 'Professional Summary',
    about_summary_1: 'I am a Senior DevOps & Platform Engineer with a unique profile: I am capable of tracing incidents all the way from an ARM Cortex firmware level up to a Kubernetes Pod. This full-stack mastery serves as a decisive differentiator in on-call and Edge/Hybrid architectures.',
    about_summary_2: 'Currently, I lead Platform Engineering for product teams of 50+ developers, designing Internal Developer Platforms (IDP), Golden Paths, and end-to-end GitOps/DevSecOps pipelines on multi-cloud Kubernetes clusters (AWS, Azure, OpenStack).',
    about_exp_title: 'Key Experience',
    about_exfo_title: 'Platform Engineer / Senior DevOps',
    about_exfo_desc: 'Designed an IDP for 50+ developers across 11 K8s clusters. Reduced release cycles by 40% using ArgoCD App of Apps and GitLab CI. Implemented end-to-end DevSecOps pipelines with Trivy/SBOM security scans and automated smoke tests. Managed multi-cloud Infrastructure as Code via Terraform and Crossplane.',
    about_delta_title: 'Ingénieur DevOps / Cloud Tech Lead',
    about_delta_desc: 'Led DevOps and FinOps initiatives for Europe\'s IoT Smart Home leader. Managed Azure AKS topologies with Terraform, maintained 99.9% SLA for REST APIs, and mentored development teams on GitOps and DevSecOps best practices.',
    about_rd_desc: 'Hardware-level programming and debugging for ARM Cortex/Linux systems at companies like NXP, Hill-Rom, Ekinops, and Itron. Pioneered early Edge architectures with Zigbee/WSN gateways.',
    about_skills_title: 'Technical Stack',
    freelance_badge: 'Freelance — Open for missions',
    freelance_title: 'Everything you just explored? <span class="gradient-text">I can build it for you.</span>',
    freelance_subtitle: "I'm an independent DevOps &amp; Platform Engineer with 12+ years of experience. This site isn't a slide deck — it's a production cluster you can click through right now. That's the same rigor I bring to your platform.",
    freelance_availability: 'Available now — remote across France &amp; Europe, on-site on request',
    freelance_offer_0_title: 'Cloud Architecture — starting at the network layer',
    freelance_offer_0_desc: "The cluster you're browsing is not a managed service. I architected and provisioned every layer of it myself on Oracle Cloud: VCN and subnet design, route tables, internet and NAT gateways, security lists and firewall rules, compute instance sizing (ARM Ampere A1), block and boot volumes, DNS records and TLS termination. Kubernetes only came afterwards — on top of a network I had drawn first. None of it is clicked in a console: the network and the instance are declared in <strong>Terraform</strong>, everything inside the machine and the cluster in <strong>Ansible</strong>. Both are public, and rebuild the whole platform from zero in under an hour.",
    freelance_offer_0_chips: '<span class="hire-chip">VCN / VPC design</span><span class="hire-chip">Subnets &amp; routing</span><span class="hire-chip">NAT &amp; Internet Gateway</span><span class="hire-chip">Security Lists / NSG</span><span class="hire-chip">Compute provisioning</span><span class="hire-chip">Block &amp; Boot volumes</span><span class="hire-chip">DNS &amp; TLS</span><span class="hire-chip">Load balancing</span><span class="hire-chip">Terraform</span><span class="hire-chip">Ansible</span>',
    freelance_offer_0_portable: 'The same architecture work, on your cloud:',
    freelance_offer_0_baremetal: 'virtualized VMs on bare-metal hypervisors',
    freelance_offer_0_note: 'Multi-cloud and bare-metal virtualization are my daily work at EXFO, across 11 Kubernetes clusters — Oracle Cloud is simply where I pay for it myself.',
    freelance_offer_1_title: 'Kubernetes Platforms',
    freelance_offer_1_desc: 'Design, migration, and hardening of K8s clusters (EKS, AKS, OpenStack, K3s). Internal Developer Platforms and Golden Paths that let your teams ship without opening a ticket.',
    freelance_offer_2_title: 'GitOps &amp; CI/CD',
    freelance_offer_2_desc: 'ArgoCD App-of-Apps, GitLab CI, Gitea Actions, Terraform and Crossplane. On my last assignment: release cycles cut by 40% and deployments that stopped being an event.',
    freelance_offer_3_title: 'Observability &amp; SRE',
    freelance_offer_3_desc: 'Prometheus, Grafana, Loki, meaningful SLOs and alerts that actually wake the right person. From blind infrastructure to a 99.9% SLA you can prove.',
    freelance_offer_4_title: 'DevSecOps &amp; FinOps',
    freelance_offer_4_desc: 'Trivy/SBOM scanning built into the pipeline, network policies, secrets management — and a cloud bill audit, because the best-architected platform is also the one you can afford.',
    freelance_proof_1: 'years from ARM firmware to Kubernetes',
    freelance_proof_2: 'developers served by the platforms I built',
    freelance_proof_3: 'certified — CNCF / Linux Foundation',
    freelance_proof_4: 'SLA held in production',
    freelance_cta_title: 'Got a platform to build, migrate, or rescue?',
    freelance_cta_desc: "Tell me about your context in a few lines — I'll reply within 48 hours with an honest read: what I'd do, how long it takes, and whether you even need me.",
    freelance_cta_mail: '✉️ Discuss your project',
    freelance_cta_linkedin: '🔗 Reach me on LinkedIn',
    freelance_cta_note: 'Time &amp; materials or fixed price · short audits as well as long-term assignments · first call always free.',
    about_freelance_pill: 'Freelance — available',
    about_hire_btn: '✉️ Hire me for your project',
    about_freelance_title: 'Available as a Freelancer',
    about_freelance_desc: "I work as an independent DevOps &amp; Platform Engineer and I'm currently taking on new assignments — remote across France &amp; Europe, on-site on request. Kubernetes platforms, GitOps and CI/CD, observability, DevSecOps and cloud cost optimization: from a two-week audit to a long-term engagement embedded in your team.",
    about_freelance_proof: 'The best proof of what I do is one click away: <a href="index.html" style="color: var(--cyan);">this entire site</a> runs on a live Kubernetes cluster I built and operate — GitOps pipeline, monitoring stack, and public dashboards included.',
    about_freelance_services: 'See my services →'
  },
  fr: {
    nav_home: 'Accueil', nav_architecture: 'Architecture', nav_infra: 'Infra Live',
    nav_demo: 'Démo', nav_tools: 'Outils', nav_admin: '🔐 Admin',
    nav_freelance: '💼 Freelance',
    hero_badge: 'Infrastructure Live — Oracle Cloud Gratuit',
    hero_badge_freelance: 'Freelance — disponible pour vos projets',
    hero_title_1: "Je suis", hero_desc: "Toute cette infrastructure — cluster Kubernetes, pipeline GitOps, stack de monitoring et application de démo — tourne en temps réel sur un seul serveur ARM provisionné gratuitement sur Oracle Cloud.",
    hero_cta_explore: "🚀 Explorer l'Infrastructure", hero_cta_demo: '🐣 Voir la Démo',
    hero_cta_hire: '💼 Travaillons Ensemble',
    arch_badge: 'Conception', arch_title: "Vue d'ensemble de l'Architecture",
    arch_subtitle: "Un écosystème DevOps complet sur une seule instance ARM",
    arch_infra: 'Infrastructure', arch_platform: 'Plateforme',
    arch_app: 'App Démo — Tamagotchi as a Service',
    infra_badge: 'Temps réel', infra_title: "Statut de l'Infrastructure en Direct",
    infra_subtitle: "Toutes les données ci-dessous sont récupérées en temps réel depuis l'API Kubernetes",
    infra_node: 'Nœud du Cluster', infra_pods: 'Pods en cours',
    infra_namespaces: 'Namespaces', infra_services: 'Services',
    infra_across: 'dans tous les namespaces', infra_active: 'namespaces actifs',
    infra_endpoints: 'endpoints exposés', infra_pod_list: 'Statut des Pods par Namespace',
    live_subtitle: "Deux façons de regarder le même cluster en production : les données brutes directement depuis l'API Kubernetes, ou les dashboards Grafana qu'elles alimentent.",
    live_tab_k8s: '☸️ API Kubernetes', live_tab_grafana: '📈 Dashboards Grafana',
    loading: 'Chargement...',
    demo_badge: 'Démo Live',
    demo_subtitle_short: "Des créatures virtuelles qui vivent comme des pods Kubernetes. Nourrissez-les ou elles meurent — et chaque action devient une métrique Prometheus.",
    demo_issues_link: '🔧 Comment je l\'ai débogué →',
    demo_subtitle: "Une application 3-tiers où des créatures virtuelles vivent comme des pods Kubernetes. Nourrissez-les ou elles meurent ! Toutes les métriques remontent vers Prometheus & Grafana en temps réel.",
    demo_frontend: 'Frontend', demo_api: 'API Backend', demo_metrics: 'Pipeline de Métriques',
    demo_frontend_desc: "Interface interactive pour adopter, nourrir, jouer et surveiller vos créatures. Thème sombre avec barres de stats en temps réel.",
    demo_api_desc: "API REST Node.js avec métriques Prometheus custom : hunger_level, happiness_score, energy_level, compteurs feed/play/sleep.",
    demo_metrics_desc: "Métriques custom scrapées par Prometheus toutes les 15s, visualisées dans un dashboard Grafana dédié avec jauges et séries temporelles.",
    demo_open: "Ouvrir l'App →", demo_api_btn: "Voir l'API →", demo_grafana: 'Ouvrir Grafana →',
    demo_live_title: '🐣 Stats des Créatures — En Direct',
    demo_alive: 'Vivantes', demo_dead: 'Mortes', demo_starving: 'Affamées',
    demo_avg_hunger: 'Faim Moy.', demo_avg_happy: 'Bonheur Moy.',
    nav_iac: "⚙️ IaC",
    iac_badge: "Infrastructure as Code",
    iac_title: "Ce cluster est <span class=\"gradient-text\">reconstructible de zéro</span>",
    iac_subtitle: "Chaque couche est déclarée en code, et le code est public. Si ce serveur disparaissait cette nuit, un <code>terraform apply</code> et un <code>ansible-playbook</code> le ramèneraient en moins d'une heure — réseau, cluster, GitOps, observabilité, applications et données.",
    iac_tf_scope: "s'arrête où finit l'API Oracle",
    iac_tf_desc: "VCN, sous-réseau, passerelle Internet, table de routage, security list, l'instance ARM, et une <strong>IP publique réservée</strong>. Terraform est employé là où il excelle : des ressources cloud qui ont un état, dont il faut détecter la dérive et relire le plan avant que quoi que ce soit ne change.",
    iac_tf_chips: "<span class=\"hire-chip\">VCN &amp; sous-réseau</span><span class=\"hire-chip\">Passerelle Internet</span><span class=\"hire-chip\">Security lists</span><span class=\"hire-chip\">Compute ARM A1</span><span class=\"hire-chip\">IP réservée</span>",
    iac_tf_link: "📂 Lire le Terraform →",
    iac_ans_scope: "tout ce qui se passe dans la machine et le cluster",
    iac_ans_desc: "Paquets, pare-feu, K3s, releases Helm, manifestes, images, timer de sauvegarde. Ansible intervient là où Terraform n'aurait que des <code>local-exec</code> : il est idempotent, se rejoue sur un cluster vivant pour corriger une dérive, et fait des valeurs Helm des fichiers versionnés au lieu de les laisser enfouies dans l'état d'une release.",
    iac_ans_chips: "<span class=\"hire-chip\">K3s</span><span class=\"hire-chip\">cert-manager</span><span class=\"hire-chip\">Envoy Gateway</span><span class=\"hire-chip\">ArgoCD</span><span class=\"hire-chip\">Linkerd</span><span class=\"hire-chip\">Prometheus</span><span class=\"hire-chip\">Gitea</span><span class=\"hire-chip\">Sauvegardes</span>",
    iac_ans_link: "📂 Lire le playbook →",
    iac_dr: "La procédure de reprise complète — avec les trois pièges qui m'ont coûté des heures : les drapeaux cloud-provider de K3s qui marquent le nœud sans un mot, Linkerd qui casse le gRPC interne d'ArgoCD, et l'image Ubuntu d'Oracle qui ferme les ports 80 et 443 quoi qu'en dise la security list.",
    iac_dr_link: "🚨 Runbook de reprise après sinistre",
    iac_repo_link: "🐙 Le dépôt complet",
    tools_badge: 'Boîte à Outils', tools_title: 'Portail DevOps',
    tools_subtitle: "Accédez à tous les outils directement. Les comptes visiteurs sont en lecture seule.",
    tool_argocd: "Livraison continue GitOps. Statut de synchronisation, santé et historique des applications.",
    tool_grafana: "Tableaux de bord pour les métriques, stats Tamagotchi et logs avec Loki.",
    tool_prometheus: "Requêtez les métriques brutes en PromQL. Explorez les métriques custom du Tamagotchi.",
    tool_gitea: "Serveur Git auto-hébergé. Parcourez le code source et les manifestes K8s.",
    tool_tamagotchi: "L'application démo 3-tiers live. Adoptez des créatures et voyez les métriques traverser toute la stack.",
    tool_readonly: 'Lecture seule', tool_viewer: 'Visualiseur', tool_noauth: "Sans authentification",
    tool_public: 'Repos publics', tool_interactive: 'Interactif !',
    tool_gitea_actions: "Pipeline d'intégration continue native compatible avec GitHub Actions.", tool_sonarqube: "Analyse statique du code pour détecter bugs, vulnérabilités et mauvaises pratiques.", tool_linkerd: "Service Mesh ultra-léger offrant observabilité, fiabilité et sécurité.", tool_public_login: 'Connexion via Gitea',
    footer_text: "Construit avec K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hébergé sur Oracle Cloud Always Free (ARM Ampere A1).",
    footer_powered: 'Propulsé par la détermination et des crédits cloud gratuits',
    nav_about: '👤 À propos', nav_back: '← Retour à l\'Accueil',
    issues_badge: 'Dépannage', issues_title: 'Problèmes Techniques Résolus', issues_subtitle: 'Une plongée approfondie dans les défis d\'ingénierie rencontrés et surmontés lors du déploiement de cette architecture sur Oracle Cloud.',
    issues_hero_badge: 'Analyse Approfondie Post-Mortem', issues_hero_title: 'Problèmes Techniques <span class="gradient-text">Résolus</span>',
    issues_hero_desc: 'Un regard approfondi sur les défis d\'ingénierie rencontrés lors du déploiement de l\'architecture microservices sur Oracle Cloud (ARM64). Découvrez les causes racines, les logs d\'erreurs exacts et les commandes terminales utilisées pour les corriger.',
    issue_1_title: 'Isolation Réseau du Runner CI/CD (Gitea Actions)',
    issue_1_desc: 'Les étapes de la pipeline CI/CD (utilisant des conteneurs via <code>act-runner</code>) échouaient à exécuter <code>git clone</code> ou à push les images Docker. Le réseau bridge Docker standard créé par <code>act-runner</code> souffrait de fragmentation MTU et de problèmes de traduction NAT lors de la communication avec les IP de Pods et Services K3s sur ce réseau virtualisé Oracle Cloud.',
    issue_1_sol: 'Nous avons configuré le <code>act-runner</code> de Gitea pour forcer tous les conteneurs de job CI à s\'exécuter sur le namespace réseau de l\'hôte, permettant aux conteneurs CI éphémères de résoudre de manière transparente les domaines <code>.svc.cluster.local</code> sans surcharge NAT.',
    issue_2_title: 'Interférence gRPC d\'ArgoCD avec Linkerd',
    issue_2_desc: 'ArgoCD est devenu complètement inaccessible. Les logs <code>argocd-server</code> étaient remplis d\'échecs de handshake TLS. L\'installation du Service Mesh Linkerd a injecté globalement des sidecars dans le namespace ArgoCD, ce qui intercepte agressivement le trafic gRPC. Or, ArgoCD s\'appuie fortement sur le gRPC interne entre son server, repo-server et application-controller.',
    issue_2_sol: 'Nous avons désactivé l\'injection proxy Linkerd spécifiquement pour le namespace ArgoCD et redémarré les contrôleurs pour restaurer la communication interne.',
    issue_3_title: 'Authentification Push Manifeste GitOps',
    issue_3_desc: 'Après avoir réussi à build l\'image Docker, la pipeline a échoué pendant la phase de mise à jour du manifeste de déploiement. Le <code>GITHUB_TOKEN</code> par défaut injecté par Gitea Actions était insuffisant pour repousser (push) vers le dépôt dans le contexte spécifique du job via HTTPS.',
    issue_3_sol: 'Nous avons modifié <code>.gitea/workflows/deploy.yaml</code> pour injecter un jeton d\'accès dédié directement dans l\'URL distante avant d\'exécuter le push.',
    issue_4_title: 'Mise en Cache Obsolète ImagePullPolicy',
    issue_4_desc: 'ArgoCD a réussi à synchroniser le nouveau manifeste <code>k8s.yaml</code>, mais les nœuds workers K3s ont refusé de le tirer. Initialement, l\'URL du registre était configurée comme le service interne <code>gitea-http.gitea.svc.cluster.local:3000</code>. Le daemon containerd de K3s résout les DNS différemment des pods et n\'a pas pu s\'authentifier correctement.',
    issue_4_sol: 'Nous avons basculé la cible du registre vers le domaine proxy externe et forcé la validation stricte du hash des couches avec <code>imagePullPolicy: Always</code>.',
    issue_5_title: 'Identifiants "Guest" RBAC ArgoCD',
    issue_5_desc: 'Le site vitrine annonçait <code>guest</code> / <code><YOUR_GUEST_PASSWORD></code> comme identifiants pour ArgoCD, mais ArgoCD a rejeté la connexion malgré un mapping RBAC correct dans le ConfigMap.',
    issue_5_sol: 'Nous avons généré un hash bcrypt brut manuellement via Python et directement patché le <code>argocd-secret</code> pour injecter le mot de passe invité en toute sécurité.',
    issue_6_title: 'Conflits de Ports Node.js vs Nginx',
    issue_6_desc: 'Une mise à jour CSS front-end a accidentellement ramené le build du conteneur à un ancien Dockerfile Nginx, provoquant une incompatibilité de port (80 vs 3000) pour le backend de métriques en direct puisque le Service Kubernetes routait toujours vers 3000.',
    issue_6_sol: 'Nous avons restauré l\'architecture proxy Node.js <code>server.js</code>, reconstruit l\'image via nerdctl, et exécuté une mise à jour de déploiement rolling K8s avec les bonnes liaisons ServiceAccount.',
    badge_issue: 'Problème', badge_resolution: 'Résolution',
    issues_connection_refused: 'Connexion Refusée / Réseau Inaccessible', issues_host_network: 'Namespace Réseau Hôte',
    issues_502: '502 Bad Gateway / Erreur Connexion gRPC', issues_disable_sidecar: 'Désactiver Injection Sidecar',
    issues_context_limit: 'Limites de Contexte', issues_oauth: 'Injection Jeton OAuth',
    issues_errimagepull: 'ErrImagePull / Déploiements Obsolètes', issues_external_domain: 'Domaine Externe & Always Pull',
    issues_rejected: 'Connexion Rejetée', issues_bcrypt: 'Patching Secret Bcrypt',
    issues_502_port: '502 Bad Gateway', issues_arch_restore: 'Restauration Architecture',
    about_hero_badge: 'Esprit curieux ? Bienvenue.', about_hero_title: 'Les Coulisses de l\'<span class="gradient-text">Architecture</span>',
    about_role: 'Senior DevOps & Platform Engineer', about_desc: 'Plus de 12 ans d\'expérience dans les télécoms, l\'IoT, le Cloud-Native et l\'Edge Computing. Spécialisation dans les plateformes cloud hybrides hautement résilientes.',
    about_linkedin: '🔗 Profil LinkedIn', about_github: '🐙 Dépôts GitHub',
    about_cert_cka: 'Score 85/100 | CNCF / Linux Foundation',
    about_summary_title: 'Résumé Professionnel',
    about_summary_1: 'Je suis un Senior DevOps & Platform Engineer avec un profil atypique : je suis capable de tracer des incidents depuis le niveau firmware d\'un ARM Cortex jusqu\'à un Pod Kubernetes. Cette maîtrise full-stack sert de différenciateur décisif lors des astreintes et dans les architectures Edge/Hybrides.',
    about_summary_2: 'Actuellement, je dirige l\'Ingénierie de Plateforme pour des équipes produits de plus de 50 développeurs, concevant des Internal Developer Platforms (IDP), des Golden Paths, et des pipelines GitOps/DevSecOps de bout en bout sur des clusters Kubernetes multi-cloud (AWS, Azure, OpenStack).',
    about_exp_title: 'Expériences Clés',
    about_exfo_title: 'Platform Engineer / Senior DevOps',
    about_exfo_desc: 'Conception d\'un IDP pour plus de 50 développeurs sur 11 clusters K8s. Réduction des cycles de release de 40% grâce à ArgoCD App of Apps et GitLab CI. Implémentation de pipelines DevSecOps complets avec scans de sécurité Trivy/SBOM et tests automatisés. Gestion d\'Infrastructure as Code multi-cloud via Terraform et Crossplane.',
    about_delta_title: 'Ingénieur DevOps / Cloud Tech Lead',
    about_delta_desc: 'Direction d\'initiatives DevOps et FinOps pour le leader européen de l\'IoT Smart Home. Gestion des topologies Azure AKS avec Terraform, maintien d\'un SLA de 99.9% pour les API REST, et mentorat des équipes de développement sur les bonnes pratiques GitOps et DevSecOps.',
    about_rd_desc: 'Programmation et débogage bas-niveau pour systèmes ARM Cortex/Linux (NXP, Hill-Rom, Ekinops, Itron). Pionnier des architectures Edge naissantes avec passerelles Zigbee/WSN.',
    about_skills_title: 'Stack Technique',
    freelance_badge: 'Freelance — Ouvert aux missions',
    freelance_title: 'Tout ce que vous venez d\'explorer ? <span class="gradient-text">Je peux le construire pour vous.</span>',
    freelance_subtitle: "Je suis DevOps &amp; Platform Engineer indépendant, avec plus de 12 ans d'expérience. Ce site n'est pas un slide de présentation : c'est un cluster en production dans lequel vous pouvez cliquer maintenant. C'est la même exigence que j'apporte à votre plateforme.",
    freelance_availability: 'Disponible dès maintenant — en remote partout en France &amp; en Europe, sur site à la demande',
    freelance_offer_0_title: "Architecture Cloud — à partir de la couche réseau",
    freelance_offer_0_desc: "Le cluster que vous parcourez n'est pas un service managé. J'en ai architecturé et provisionné chaque couche moi-même sur Oracle Cloud : conception du VCN et des sous-réseaux, tables de routage, passerelles Internet et NAT, security lists et règles de pare-feu, dimensionnement des instances de calcul (ARM Ampere A1), volumes block et boot, enregistrements DNS et terminaison TLS. Kubernetes n'est venu qu'ensuite — par-dessus un réseau que j'avais dessiné d'abord. Rien de tout cela n'est cliqué dans une console : le réseau et l'instance sont déclarés en <strong>Terraform</strong>, tout ce qui vit dans la machine et le cluster en <strong>Ansible</strong>. Les deux sont publics, et reconstruisent la plateforme entière de zéro en moins d'une heure.",
    freelance_offer_0_chips: '<span class="hire-chip">Conception VCN / VPC</span><span class="hire-chip">Sous-réseaux &amp; routage</span><span class="hire-chip">Passerelles NAT &amp; Internet</span><span class="hire-chip">Security Lists / NSG</span><span class="hire-chip">Provisionnement compute</span><span class="hire-chip">Volumes Block &amp; Boot</span><span class="hire-chip">DNS &amp; TLS</span><span class="hire-chip">Répartition de charge</span><span class="hire-chip">Terraform</span><span class="hire-chip">Ansible</span>',
    freelance_offer_0_portable: 'Le même travail d\'architecture, sur votre cloud :',
    freelance_offer_0_baremetal: 'VM virtualisées sur hyperviseurs bare-metal',
    freelance_offer_0_note: "Le multi-cloud et la virtualisation bare-metal sont mon quotidien chez EXFO, sur 11 clusters Kubernetes — Oracle Cloud est simplement celui que je paie de ma poche.",
    freelance_offer_1_title: 'Plateformes Kubernetes',
    freelance_offer_1_desc: "Conception, migration et durcissement de clusters K8s (EKS, AKS, OpenStack, K3s). Internal Developer Platforms et Golden Paths pour que vos équipes livrent sans ouvrir de ticket.",
    freelance_offer_2_title: 'GitOps &amp; CI/CD',
    freelance_offer_2_desc: "ArgoCD App-of-Apps, GitLab CI, Gitea Actions, Terraform et Crossplane. Sur ma dernière mission : des cycles de release réduits de 40% et des déploiements qui ont cessé d'être un événement.",
    freelance_offer_3_title: 'Observabilité &amp; SRE',
    freelance_offer_3_desc: "Prometheus, Grafana, Loki, des SLO qui ont du sens et des alertes qui réveillent la bonne personne. D'une infrastructure aveugle à un SLA de 99,9% que vous pouvez prouver.",
    freelance_offer_4_title: 'DevSecOps &amp; FinOps',
    freelance_offer_4_desc: "Scans Trivy/SBOM intégrés à la pipeline, network policies, gestion des secrets — et un audit de votre facture cloud, parce que la meilleure plateforme est aussi celle que vous pouvez financer.",
    freelance_proof_1: "ans, du firmware ARM jusqu'à Kubernetes",
    freelance_proof_2: 'développeurs servis par les plateformes que j\'ai construites',
    freelance_proof_3: 'certifié — CNCF / Linux Foundation',
    freelance_proof_4: 'de SLA tenu en production',
    freelance_cta_title: 'Une plateforme à construire, migrer ou sauver ?',
    freelance_cta_desc: "Décrivez-moi votre contexte en quelques lignes — je vous réponds sous 48h avec un avis honnête : ce que je ferais, combien de temps ça prend, et si vous avez vraiment besoin de moi.",
    freelance_cta_mail: '✉️ Parlons de votre projet',
    freelance_cta_linkedin: '🔗 Me contacter sur LinkedIn',
    freelance_cta_note: 'Régie ou forfait · audits courts comme missions longues · premier échange toujours offert.',
    about_freelance_pill: 'Freelance — disponible',
    about_hire_btn: '✉️ Me confier votre projet',
    about_freelance_title: 'Disponible en Freelance',
    about_freelance_desc: "J'interviens en tant que DevOps &amp; Platform Engineer indépendant et je prends actuellement de nouvelles missions — en remote partout en France &amp; en Europe, sur site à la demande. Plateformes Kubernetes, GitOps et CI/CD, observabilité, DevSecOps et optimisation des coûts cloud : de l'audit de deux semaines à la mission longue intégrée à votre équipe.",
    about_freelance_proof: "La meilleure preuve de ce que je fais est à un clic : <a href=\"index.html\" style=\"color: var(--cyan);\">tout ce site</a> tourne sur un cluster Kubernetes en production que j'ai construit et que j'exploite — pipeline GitOps, stack de monitoring et dashboards publics inclus.",
    about_freelance_services: 'Voir mes prestations →'
  }
};

let currentLang = 'en';

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// ---- Typewriter Effect ----
const typewriterLines = [
  'Freelance DevOps & Platform Engineer',
  'Cloud Infrastructure Architect',
  'Kubernetes & ArgoCD Enthusiast',
  'Automation is my superpower ⚡',
];
let twLineIdx = 0, twCharIdx = 0, twDeleting = false;

function typewrite() {

  const el = document.getElementById('typewriter');
  if (!el) return;
  const line = typewriterLines[twLineIdx];

  if (!twDeleting) {
    el.textContent = line.substring(0, twCharIdx + 1);
    twCharIdx++;
    if (twCharIdx >= line.length) {
      twDeleting = true;
      setTimeout(typewrite, 2000);
      return;
    }
    setTimeout(typewrite, 70);
  } else {
    el.textContent = line.substring(0, twCharIdx);
    twCharIdx--;
    if (twCharIdx < 0) {
      twDeleting = false;
      twLineIdx = (twLineIdx + 1) % typewriterLines.length;
      twCharIdx = 0;
      setTimeout(typewrite, 400);
      return;
    }
    setTimeout(typewrite, 35);
  }
}

// ---- Terminal Animation ----
const terminalCommands = [
  { cmd: 'kubectl get nodes', output: [
    'NAME                STATUS   ROLES           AGE   VERSION',
    'k3s-argocd-server   Ready    control-plane   1d    v1.36.2+k3s1',
  ]},
  { cmd: 'kubectl get pods -n tamagotchi', output: [
    'NAME                                   READY   STATUS    RESTARTS   AGE',
    'postgres-7c98c5b785-5nqhl              1/1     Running   0          1d',
    'tamagotchi-api-fd8f8ddf9-b6cfj         1/1     Running   0          1d',
    'tamagotchi-api-fd8f8ddf9-v6prj         1/1     Running   0          1d',
    'tamagotchi-frontend-667d7c99cb-gqxg4   1/1     Running   0          1d',
  ]},
  { cmd: 'kubectl get httproutes --all-namespaces', output: [
    'NAMESPACE    NAME               HOSTNAMES',
    'argocd       argocd-route       ["argocd.khalilaliouich.com"]',
    'gitea        gitea-route        ["git.khalilaliouich.com"]',
    'monitoring   grafana-route      ["grafana.khalilaliouich.com"]',
    'tamagotchi   demo-route         ["demo.khalilaliouich.com"]',
  ]},
  { cmd: 'helm list --all-namespaces', output: [
    'NAME            NAMESPACE       STATUS    CHART',
    'envoy-gateway   envoy-gateway   deployed  envoy-gateway-1.0.1',
    'cert-manager    cert-manager    deployed  cert-manager-v1.20.3',
    'gitea           gitea           deployed  gitea-10.6.0',
    'kube-prometheus monitoring      deployed  kube-prometheus-stack-68.4.5',
    'loki            monitoring      deployed  loki-stack-2.10.2',
  ]},
];

let termCmdIdx = 0;

async function animateTerminal() {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  while (true) {
    const { cmd, output } = terminalCommands[termCmdIdx % terminalCommands.length];

    // Type command
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal__line';
    const prompt = document.createElement('span');
    prompt.className = 'terminal__prompt';
    prompt.textContent = '$ ';
    const cmdSpan = document.createElement('span');
    cmdSpan.className = 'terminal__cmd';
    cmdLine.appendChild(prompt);
    cmdLine.appendChild(cmdSpan);
    body.appendChild(cmdLine);
    body.scrollTop = body.scrollHeight;

    for (let i = 0; i < cmd.length; i++) {
      cmdSpan.textContent += cmd[i];
      await sleep(40 + Math.random() * 30);
    }
    await sleep(300);

    // Print output
    for (const line of output) {
      const outLine = document.createElement('div');
      outLine.className = 'terminal__line';
      const outSpan = document.createElement('span');
      outSpan.className = line.includes('Running') || line.includes('Ready') || line.includes('deployed')
        ? 'terminal__output--highlight'
        : 'terminal__output';
      outSpan.textContent = line;
      outLine.appendChild(outSpan);
      body.appendChild(outLine);
      body.scrollTop = body.scrollHeight;
      await sleep(80);
    }

    await sleep(3000);

    // Clear for next command (keep last 2 commands)
    const lines = body.querySelectorAll('.terminal__line');
    if (lines.length > 20) {
      for (let i = 0; i < lines.length - 10; i++) lines[i].remove();
    }

    termCmdIdx++;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- Fetch Tamagotchi Stats ----
async function fetchTamagotchiStats() {
  try {
    const res = await fetch(`${TAMAGOTCHI_API}/stats`);
    if (!res.ok) return;
    const s = await res.json();
    document.getElementById('tAlive').textContent = s.alive_count || 0;
    document.getElementById('tDead').textContent = s.dead_count || 0;
    document.getElementById('tStarving').textContent = s.starving_count || 0;
    document.getElementById('tAvgHunger').textContent = s.avg_hunger ? `${s.avg_hunger}%` : '—';
    document.getElementById('tAvgHappy').textContent = s.avg_happiness ? `${s.avg_happiness}%` : '—';
  } catch (e) {
    console.warn('Tamagotchi stats unavailable:', e.message);
  }
}

// ---- Fetch Infra Data ----
async function populateInfraData() {
  try {
    const res = await fetch('/api/infra');
    const data = await res.json();
    
    if (data.error) {
      document.getElementById('podList').innerHTML = `<div class="pod-list__loading">Error: ${data.error}</div>`;
      return;
    }

    // Chaque jauge vient de Prometheus ; pct null = donnee indisponible,
    // on affiche alors une barre vide plutot qu'une valeur inventee.
    [['cpu', 'cpuFill', 'cpuValue'], ['ram', 'ramFill', 'ramValue'], ['disk', 'diskFill', 'diskValue']]
      .forEach(([key, fillId, valueId]) => {
        const g = data[key] || {};
        document.getElementById(fillId).style.width = g.pct === null || g.pct === undefined ? '0%' : `${g.pct}%`;
        document.getElementById(valueId).textContent = g.label || '—';
      });
    document.getElementById('podCount').textContent = data.podCount;
    document.getElementById('nsCount').textContent = data.nsCount;
    document.getElementById('svcCount').textContent = data.svcCount;

    const podList = document.getElementById('podList');
    podList.innerHTML = data.pods.map(p => {
      const statusClass = p.status === 'Running' ? 'running' : p.status === 'Pending' ? 'pending' : 'failed';
      return `
        <div class="pod-item">
          <span class="pod-item__status pod-item__status--${statusClass}"></span>
          <span class="pod-item__ns">${p.ns}</span>
          <span class="pod-item__name">${p.name}</span>
          <span class="pod-item__ready">${p.ready}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    document.getElementById('podList').innerHTML = `<div class="pod-list__loading">Failed to load data</div>`;
  }
}

// ---- Scroll Animations ----
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.arch-layer, .infra-card, .demo-card, .tool-card, .demo-live').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

// ---- Tabs (section Live) ----
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById('tab-' + btn.dataset.tab);
      if (pane) pane.classList.add('active');
    });
  });
}

// ---- Active Nav Link ----
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) current = section.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });
}

// ---- Admin Modal ----
const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
let isAdmin = false;

document.getElementById('adminBtn').addEventListener('click', () => {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('adminBtn').textContent = '🔐 Admin';
    return;
  }
  adminModal.classList.add('active');
});

document.getElementById('cancelAdmin').addEventListener('click', () => {
  adminModal.classList.remove('active');
});

adminModal.addEventListener('click', (e) => {
  if (e.target === adminModal) adminModal.classList.remove('active');
});

adminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const secret = document.getElementById('adminSecret').value;
  if (secret === DEMO_SECRET) {
    isAdmin = true;
    adminModal.classList.remove('active');
    document.getElementById('adminBtn').textContent = '🔓 Admin (ON)';
    document.getElementById('adminBtn').style.color = '#00ff88';
    document.getElementById('adminBtn').style.borderColor = '#00ff88';
  } else {
    document.getElementById('adminSecret').style.borderColor = '#ff4466';
    setTimeout(() => { document.getElementById('adminSecret').style.borderColor = ''; }, 1500);
  }
});

// ---- Refresh Button ----
document.getElementById('refreshPods').addEventListener('click', () => {
  populateInfraData();
});

// ---- Init ----
typewrite();
animateTerminal();
populateInfraData();
fetchTamagotchiStats();
setInterval(fetchTamagotchiStats, 10000);
initScrollAnimations();
initActiveNav();
initTabs();

// ---- Hamburger Menu ----
function initHamburgerMenu() {
  const nav = document.getElementById('nav');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.querySelectorAll('.nav__link');

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (nav.classList.contains('mobile-open')) {
        nav.classList.remove('mobile-open');
      }
    });
  });
}
initHamburgerMenu();
