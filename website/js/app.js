// ============================================================================
// DevOps Showcase — Main Application Logic
// Live K8s data, typewriter, i18n, admin mode, scroll animations
// ============================================================================

const VM_IP = '<YOUR_VM_IP>';
const NIP = 'khalilaliouich.com';
const TAMAGOTCHI_API = `https://demo.${NIP}/api`;
const SHOWCASE_API = window.location.origin;
const DEMO_SECRET = '<YOUR_DEMO_SECRET>';

// ---- i18n ----
const i18n = {
  en: {
    nav_home: 'Home', nav_architecture: 'Architecture', nav_infra: 'Live Infra',
    nav_demo: 'Demo App', nav_tools: 'Tools', nav_admin: '🔐 Admin',
    nav_dashboard: 'Dashboard', nav_issues: 'Issues',
    hero_badge: 'Live Infrastructure — Oracle Cloud Always Free',
    hero_title_1: "Hi, I'm", hero_desc: 'This entire infrastructure — Kubernetes cluster, GitOps pipeline, monitoring stack, and demo app — is running live on a single ARM server provisioned for free on Oracle Cloud.',
    hero_cta_explore: '🚀 Explore Live Infrastructure', hero_cta_demo: '🐣 See Demo App',
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
    loading: 'Loading...',
    demo_badge: 'Live Demo',
    demo_subtitle: 'A 3-tier application where virtual creatures live as Kubernetes pods. Feed them or they die! All metrics flow to Prometheus & Grafana in real-time.',
    demo_frontend: 'Frontend', demo_api: 'API Backend', demo_metrics: 'Metrics Pipeline',
    demo_frontend_desc: 'Interactive UI to adopt, feed, play with, and monitor your creatures. Dark theme with real-time stat bars.',
    demo_api_desc: 'Node.js REST API with custom Prometheus metrics: hunger_level, happiness_score, energy_level, feed/play/sleep counters.',
    demo_metrics_desc: 'Custom metrics scraped by Prometheus every 15s, visualized in a dedicated Grafana dashboard with gauges, time series, and alerts.',
    demo_open: 'Open App →', demo_api_btn: 'View API →', demo_grafana: 'Open Grafana →',
    demo_live_title: '🐣 Creature Stats — Live',
    demo_alive: 'Alive', demo_dead: 'Dead', demo_starving: 'Starving',
    demo_avg_hunger: 'Avg Hunger', demo_avg_happy: 'Avg Happiness',
    tools_badge: 'Toolbox', tools_title: 'DevOps Tools Portal',
    tools_subtitle: 'Access all tools directly. Visitor accounts are read-only for security.',
    tool_argocd: 'GitOps continuous delivery. See application sync status, health, and history.',
    tool_grafana: 'Dashboards for metrics, Tamagotchi stats, and Loki log exploration.',
    tool_prometheus: 'Query raw metrics with PromQL. Explore Tamagotchi custom metrics.',
    tool_gitea: 'Self-hosted Git server. Browse the Tamagotchi source code and K8s manifests.',
    tool_tamagotchi: 'The live 3-tier demo app. Adopt creatures, see metrics flow through the entire stack.',
    tool_readonly: 'Read Only', tool_viewer: 'Viewer', tool_noauth: 'No authentication',
    tool_public: 'Public repos', tool_interactive: 'Interactive!',
    tool_gitea_actions: 'Native Continuous Integration pipeline compatible with GitHub Actions.', tool_linkerd: 'Ultralight Service Mesh providing observability, reliability, and security.', tool_public_login: 'Login via Gitea',
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
    about_skills_title: 'Technical Stack'
  },
  fr: {
    nav_home: 'Accueil', nav_architecture: 'Architecture', nav_infra: 'Infra Live',
    nav_demo: 'App Démo', nav_tools: 'Outils', nav_admin: '🔐 Admin',
    nav_dashboard: 'Tableau de bord', nav_issues: 'Incidents',
    hero_badge: 'Infrastructure Live — Oracle Cloud Gratuit',
    hero_title_1: "Je suis", hero_desc: "Toute cette infrastructure — cluster Kubernetes, pipeline GitOps, stack de monitoring et application de démo — tourne en temps réel sur un seul serveur ARM provisionné gratuitement sur Oracle Cloud.",
    hero_cta_explore: "🚀 Explorer l'Infrastructure", hero_cta_demo: '🐣 Voir la Démo',
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
    loading: 'Chargement...',
    demo_badge: 'Démo Live',
    demo_subtitle: "Une application 3-tiers où des créatures virtuelles vivent comme des pods Kubernetes. Nourrissez-les ou elles meurent ! Toutes les métriques remontent vers Prometheus & Grafana en temps réel.",
    demo_frontend: 'Frontend', demo_api: 'API Backend', demo_metrics: 'Pipeline de Métriques',
    demo_frontend_desc: "Interface interactive pour adopter, nourrir, jouer et surveiller vos créatures. Thème sombre avec barres de stats en temps réel.",
    demo_api_desc: "API REST Node.js avec métriques Prometheus custom : hunger_level, happiness_score, energy_level, compteurs feed/play/sleep.",
    demo_metrics_desc: "Métriques custom scrapées par Prometheus toutes les 15s, visualisées dans un dashboard Grafana dédié avec jauges et séries temporelles.",
    demo_open: "Ouvrir l'App →", demo_api_btn: "Voir l'API →", demo_grafana: 'Ouvrir Grafana →',
    demo_live_title: '🐣 Stats des Créatures — En Direct',
    demo_alive: 'Vivantes', demo_dead: 'Mortes', demo_starving: 'Affamées',
    demo_avg_hunger: 'Faim Moy.', demo_avg_happy: 'Bonheur Moy.',
    tools_badge: 'Boîte à Outils', tools_title: 'Portail DevOps',
    tools_subtitle: "Accédez à tous les outils directement. Les comptes visiteurs sont en lecture seule.",
    tool_argocd: "Livraison continue GitOps. Statut de synchronisation, santé et historique des applications.",
    tool_grafana: "Tableaux de bord pour les métriques, stats Tamagotchi et logs avec Loki.",
    tool_prometheus: "Requêtez les métriques brutes en PromQL. Explorez les métriques custom du Tamagotchi.",
    tool_gitea: "Serveur Git auto-hébergé. Parcourez le code source et les manifestes K8s.",
    tool_tamagotchi: "L'application démo 3-tiers live. Adoptez des créatures et voyez les métriques traverser toute la stack.",
    tool_readonly: 'Lecture seule', tool_viewer: 'Visualiseur', tool_noauth: "Sans authentification",
    tool_public: 'Repos publics', tool_interactive: 'Interactif !',
    tool_gitea_actions: "Pipeline d'intégration continue native compatible avec GitHub Actions.", tool_linkerd: "Service Mesh ultra-léger offrant observabilité, fiabilité et sécurité.", tool_public_login: 'Connexion via Gitea',
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
    about_skills_title: 'Stack Technique'
  }
};

// Le choix de langue était perdu à chaque navigation : le site repassait en
// anglais en arrivant sur about.html ou issues.html. On le persiste, avec repli
// sur la langue du navigateur au premier passage.
const LANG_KEY = 'ka-lang';
const SUPPORTED_LANGS = ['en', 'fr'];

function initialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (SUPPORTED_LANGS.includes(saved)) return saved;
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'en';
}

let currentLang = initialLang();

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

// Rempli par initArchTooltips() si une infobulle est ouverte au moment du
// changement de langue, pour la rafraîchir plutôt que de la laisser périmée.
let onLangChange = null;

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* mode privé */ }
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  if (onLangChange) onLangChange();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// Applique la langue retenue dès le chargement de chaque page.
setLang(currentLang);

// ---- Typewriter Effect ----
const typewriterLines = [
  'DevOps Engineer',
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

    document.getElementById('cpuFill').style.width = data.cpu;
    document.getElementById('cpuValue').textContent = data.cpu;
    document.getElementById('ramFill').style.width = '18%'; // mock
    document.getElementById('ramValue').textContent = data.ram;
    document.getElementById('diskFill').style.width = '25%'; // mock
    document.getElementById('diskValue').textContent = data.disk;
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
// Ces éléments n'existent que sur index.html. Sans cette garde, une erreur
// non interceptée ici stoppait l'exécution du reste du script sur about.html
// et issues.html — y compris initHamburgerMenu() plus bas, qui ne s'exécutait
// donc jamais : le menu mobile de ces deux pages était mort en silence.
const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
const adminBtn = document.getElementById('adminBtn');
let isAdmin = false;

if (adminBtn && adminModal && adminForm) {
  adminBtn.addEventListener('click', () => {
    if (isAdmin) {
      isAdmin = false;
      adminBtn.textContent = '🔐 Admin';
      return;
    }
    adminModal.classList.add('active');
  });

  document.getElementById('cancelAdmin')?.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.remove('active');
  });

  adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const secretInput = document.getElementById('adminSecret');
    if (secretInput.value === DEMO_SECRET) {
      isAdmin = true;
      adminModal.classList.remove('active');
      adminBtn.textContent = '🔓 Admin (ON)';
      adminBtn.style.color = '#00ff88';
      adminBtn.style.borderColor = '#00ff88';
    } else {
      secretInput.style.borderColor = '#ff4466';
      setTimeout(() => { secretInput.style.borderColor = ''; }, 1500);
    }
  });
}

// ---- Refresh Button ----
document.getElementById('refreshPods')?.addEventListener('click', () => {
  populateInfraData();
});

// ---- Init ----
// Ces fonctions lisent aussi des éléments propres à index.html : gardées pour
// ne s'exécuter que là où elles ont un effet.
if (document.getElementById('typewriter')) typewrite();
if (document.getElementById('termCmd')) animateTerminal();
if (document.getElementById('podList')) populateInfraData();
if (document.getElementById('tamagotchiStats')) {
  fetchTamagotchiStats();
  setInterval(fetchTamagotchiStats, 10000);
}
initScrollAnimations();
initActiveNav();
initArchTooltips();

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

// ---- Architecture Tooltips ----
// Infobulle riche au survol de chaque brique du diagramme "Architecture
// Overview" : définition générale de l'outil + son rôle précis dans CETTE
// architecture (pas une description marketing générique).
const ARCH_TOOLTIP_DATA = {
  oci: {
    icon: '🖥️', accent: 'cyan',
    title: { en: 'Oracle Cloud ARM VM', fr: 'VM ARM Oracle Cloud' },
    badge: { en: 'Infrastructure', fr: 'Infrastructure' },
    def: {
      en: 'A single Ampere A1 (ARM64) virtual machine — 4 OCPUs, 24GB RAM — provisioned entirely within Oracle Cloud\'s Always Free tier.',
      fr: "Une unique VM Ampere A1 (ARM64) — 4 OCPUs, 24 Go de RAM — provisionnée intégralement dans le Free Tier d'Oracle Cloud."
    },
    role: {
      en: 'It is the <b>only</b> physical resource this entire stack runs on — no other server, no managed service. Every component in this diagram shares this same CPU, RAM and disk.',
      fr: "C'est la <b>seule</b> ressource physique sur laquelle tourne toute cette stack — aucun autre serveur, aucun service managé. Chaque brique de ce schéma partage ce même CPU, cette même RAM et ce même disque."
    }
  },
  k3s: {
    icon: '☸️', accent: 'cyan',
    title: { en: 'K3s', fr: 'K3s' },
    badge: { en: 'Infrastructure', fr: 'Infrastructure' },
    def: {
      en: 'A lightweight, CNCF-certified Kubernetes distribution shipped as a single ~70MB binary.',
      fr: 'Une distribution Kubernetes légère et certifiée CNCF, livrée sous la forme d\'un seul binaire d\'environ 70 Mo.'
    },
    role: {
      en: 'It is the <b>orchestrator</b> that schedules every pod on this page — from ArgoCD to the Tamagotchi demo — onto the VM above. Traefik was removed at install time in favor of Envoy Gateway.',
      fr: "C'est l'<b>orchestrateur</b> qui planifie chaque pod visible sur cette page — d'ArgoCD à la démo Tamagotchi — sur la VM ci-dessus. Traefik a été retiré à l'installation au profit d'Envoy Gateway."
    }
  },
  gateway: {
    icon: '🌐', accent: 'cyan',
    title: { en: 'Envoy Gateway', fr: 'Envoy Gateway' },
    badge: { en: 'Infrastructure', fr: 'Infrastructure' },
    def: {
      en: 'The Kubernetes Gateway API implementation, powered by the Envoy proxy, replacing a traditional Ingress controller.',
      fr: "L'implémentation de la Gateway API de Kubernetes, propulsée par le proxy Envoy, en remplacement d'un contrôleur Ingress classique."
    },
    role: {
      en: 'Every hostname on khalilaliouich.com — this site, ArgoCD, Grafana, Gitea… — is routed through <b>one single Gateway</b> and its HTTPRoutes, terminating TLS with certificates issued by cert-manager.',
      fr: 'Chaque sous-domaine de khalilaliouich.com — ce site, ArgoCD, Grafana, Gitea… — passe par une <b>Gateway unique</b> et ses HTTPRoutes, avec un TLS terminé par des certificats émis par cert-manager.'
    }
  },
  argocd: {
    icon: '🔄', accent: 'purple',
    title: { en: 'ArgoCD', fr: 'ArgoCD' },
    badge: { en: 'Platform · GitOps', fr: 'Platform · GitOps' },
    def: {
      en: 'A GitOps continuous delivery tool: it continuously reconciles the live cluster state against manifests stored in Git.',
      fr: "Un outil de livraison continue GitOps : il réconcilie en continu l'état réel du cluster avec les manifestes stockés dans Git."
    },
    role: {
      en: 'It watches this project\'s <b>k8s/</b> folder on Gitea and applies changes automatically — <b>selfHeal</b> and <b>prune</b> are both enabled, so a manual kubectl edit gets reverted back to what is committed.',
      fr: 'Il surveille le dossier <b>k8s/</b> de ce projet sur Gitea et applique les changements automatiquement — <b>selfHeal</b> et <b>prune</b> sont activés : une modification kubectl manuelle est annulée pour revenir à ce qui est commité.'
    }
  },
  gitea: {
    icon: '🐙', accent: 'purple',
    title: { en: 'Gitea', fr: 'Gitea' },
    badge: { en: 'Platform · Git', fr: 'Platform · Git' },
    def: {
      en: 'A lightweight, self-hosted Git service — the same core workflow as GitHub, running in a single low-memory pod.',
      fr: 'Un service Git léger et auto-hébergé — le même workflow de base que GitHub, dans un seul pod peu gourmand en mémoire.'
    },
    role: {
      en: 'It hosts the source code for this website and the Tamagotchi app, and its <b>Gitea Actions</b> runner executes this project\'s CI/CD pipeline (build, scan, push image).',
      fr: "Il héberge le code source de ce site et de l'app Tamagotchi, et son runner <b>Gitea Actions</b> exécute le pipeline CI/CD du projet (build, scan, push d'image)."
    }
  },
  prometheus: {
    icon: '📊', accent: 'purple',
    title: { en: 'Prometheus', fr: 'Prometheus' },
    badge: { en: 'Platform · Metrics', fr: 'Platform · Métriques' },
    def: {
      en: 'A time-series database and monitoring system that scrapes metrics from targets on a fixed schedule.',
      fr: 'Une base de données de séries temporelles et un système de supervision qui interroge ses cibles à intervalle régulier.'
    },
    role: {
      en: 'It pulls the real CPU / RAM / disk numbers shown live in the section below, plus custom Tamagotchi metrics like hunger and happiness — this page\'s backend queries it directly via PromQL.',
      fr: 'Il collecte les vrais chiffres CPU / RAM / disque affichés en direct dans la section ci-dessous, ainsi que les métriques Tamagotchi (faim, bonheur) — le backend de ce site l\'interroge directement en PromQL.'
    }
  },
  grafana: {
    icon: '📈', accent: 'purple',
    title: { en: 'Grafana', fr: 'Grafana' },
    badge: { en: 'Platform · Dashboards', fr: 'Platform · Dashboards' },
    def: {
      en: 'A visualization layer that turns raw Prometheus and Loki data into dashboards.',
      fr: 'Une couche de visualisation qui transforme les données brutes de Prometheus et Loki en dashboards.'
    },
    role: {
      en: 'The public account linked in the Tools section is intentionally locked to <b>viewer permissions</b> — visitors can explore real dashboards without being able to modify anything.',
      fr: 'Le compte public accessible depuis la section Outils est volontairement limité aux <b>permissions de lecture</b> — les visiteurs explorent de vrais dashboards sans pouvoir rien modifier.'
    }
  },
  loki: {
    icon: '📝', accent: 'purple',
    title: { en: 'Loki', fr: 'Loki' },
    badge: { en: 'Platform · Logs', fr: 'Platform · Logs' },
    def: {
      en: 'A log aggregation system built like Prometheus, but for logs instead of metrics.',
      fr: 'Un système d\'agrégation de logs conçu comme Prometheus, mais pour les logs plutôt que les métriques.'
    },
    role: {
      en: 'Promtail ships every pod\'s stdout/stderr here. The <b>Live Dashboard</b> section further down embeds a Grafana panel querying Loki directly, so you can watch cluster logs stream in your browser.',
      fr: "Promtail y envoie les logs stdout/stderr de chaque pod. La section <b>Live Dashboard</b> plus bas embarque un panneau Grafana qui interroge Loki directement, pour suivre les logs du cluster en direct dans le navigateur."
    }
  },
  frontend: {
    icon: '📱', accent: 'green',
    title: { en: 'Frontend', fr: 'Frontend' },
    badge: { en: 'Demo App · UI', fr: 'Demo App · UI' },
    def: {
      en: 'The demo app\'s user interface — plain HTML/JS served as static files.',
      fr: "L'interface utilisateur de l'app démo — du HTML/JS pur servi en fichiers statiques."
    },
    role: {
      en: 'This is the part of Tamagotchi as a Service you actually click around in: adopting creatures, feeding them, watching them react near real-time.',
      fr: "C'est la partie de Tamagotchi as a Service que l'on manipule réellement : adopter des créatures, les nourrir, observer leurs réactions quasi en temps réel."
    }
  },
  api: {
    icon: '⚙️', accent: 'green',
    title: { en: 'API', fr: 'API' },
    badge: { en: 'Demo App · Backend', fr: 'Demo App · Backend' },
    def: {
      en: 'A Node.js / Express backend exposing REST endpoints and a /metrics endpoint in Prometheus format.',
      fr: 'Un backend Node.js / Express exposant des endpoints REST et un endpoint /metrics au format Prometheus.'
    },
    role: {
      en: 'Every action in the frontend hits this API, which updates PostgreSQL and simultaneously exposes gauges like <b>tamagotchi_hunger_level</b> for Prometheus to scrape.',
      fr: 'Chaque action du frontend passe par cette API, qui met à jour PostgreSQL et expose simultanément des jauges comme <b>tamagotchi_hunger_level</b> que Prometheus vient collecter.'
    }
  },
  postgres: {
    icon: '🗄️', accent: 'green',
    title: { en: 'PostgreSQL', fr: 'PostgreSQL' },
    badge: { en: 'Demo App · Database', fr: 'Demo App · Base de données' },
    def: {
      en: 'A relational database — the persistence layer for the demo app.',
      fr: "Une base de données relationnelle — la couche de persistance de l'app démo."
    },
    role: {
      en: 'It stores every creature\'s state (hunger, happiness, alive/dead) so the Tamagotchi app <b>survives pod restarts</b> instead of resetting on every redeploy.',
      fr: "Il stocke l'état de chaque créature (faim, bonheur, vivant/mort) pour que l'app Tamagotchi <b>survive aux redémarrages de pods</b> au lieu de repartir à zéro à chaque déploiement."
    }
  }
};

function initArchTooltips() {
  const nodes = document.querySelectorAll('.arch-node[data-node]');
  if (!nodes.length) return;

  const tip = document.createElement('div');
  tip.className = 'arch-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.innerHTML = `
    <div class="arch-tooltip__arrow"></div>
    <div class="arch-tooltip__head">
      <span class="arch-tooltip__icon"></span>
      <div>
        <div class="arch-tooltip__title"></div>
        <span class="arch-tooltip__badge"></span>
      </div>
    </div>
    <p class="arch-tooltip__def"></p>
    <div class="arch-tooltip__role">
      <span class="arch-tooltip__role-icon">📍</span>
      <span class="arch-tooltip__role-text"></span>
    </div>
  `;
  document.body.appendChild(tip);

  const els = {
    icon: tip.querySelector('.arch-tooltip__icon'),
    title: tip.querySelector('.arch-tooltip__title'),
    badge: tip.querySelector('.arch-tooltip__badge'),
    def: tip.querySelector('.arch-tooltip__def'),
    role: tip.querySelector('.arch-tooltip__role-text')
  };

  const ACCENT_VARS = { cyan: 'var(--cyan)', purple: 'var(--purple)', green: 'var(--green)' };
  let activeNode = null;
  let hideTimer = null;

  function position(node) {
    const r = node.getBoundingClientRect();
    tip.style.left = '0px';
    tip.style.top = '0px';
    // Mesure hors-écran d'abord pour connaître ses dimensions réelles.
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const margin = 14;

    let placeAbove = r.top - th - margin > 8;
    let top = placeAbove ? r.top - th - margin : r.bottom + margin;
    let left = r.left + r.width / 2 - tw / 2;

    const maxLeft = window.innerWidth - tw - 10;
    left = Math.max(10, Math.min(left, maxLeft));

    tip.classList.toggle('arch-tooltip--arrow-bottom', placeAbove);
    tip.classList.toggle('arch-tooltip--arrow-top', !placeAbove);

    const arrowLeft = Math.max(16, Math.min(r.left + r.width / 2 - left - 7, tw - 30));
    tip.querySelector('.arch-tooltip__arrow').style.left = `${arrowLeft}px`;
    tip.style.setProperty('--tt-origin-x', `${((r.left + r.width / 2 - left) / tw) * 100}%`);
    tip.style.setProperty('--tt-origin-y', placeAbove ? '100%' : '0%');

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function show(node) {
    const data = ARCH_TOOLTIP_DATA[node.dataset.node];
    if (!data) return;
    clearTimeout(hideTimer);
    activeNode = node;

    tip.style.setProperty('--tt-accent', ACCENT_VARS[data.accent] || ACCENT_VARS.cyan);
    els.icon.textContent = data.icon;
    els.title.textContent = data.title[currentLang] || data.title.en;
    els.badge.textContent = data.badge[currentLang] || data.badge.en;
    els.def.textContent = data.def[currentLang] || data.def.en;
    els.role.innerHTML = data.role[currentLang] || data.role.en;

    tip.classList.add('arch-tooltip--visible');
    position(node);
  }

  function hide() {
    activeNode = null;
    tip.classList.remove('arch-tooltip--visible');
  }

  nodes.forEach(node => {
    node.addEventListener('mouseenter', () => show(node));
    node.addEventListener('mouseleave', () => { hideTimer = setTimeout(hide, 60); });
    node.addEventListener('focus', () => show(node));
    node.addEventListener('blur', hide);
    // Tactile : bascule au tap, se referme au tap suivant ailleurs.
    node.addEventListener('click', (e) => {
      if (activeNode === node) { hide(); return; }
      e.stopPropagation();
      show(node);
    });
  });

  document.addEventListener('click', () => hide());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', () => { if (activeNode) hide(); }, { passive: true });
  window.addEventListener('resize', () => { if (activeNode) position(activeNode); });

  // Rafraîchit le contenu affiché plutôt que de le laisser dans une langue périmée.
  onLangChange = () => { if (activeNode) show(activeNode); };
}
