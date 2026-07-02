// ============================================================================
// DevOps Showcase — Main Application Logic
// Live K8s data, typewriter, i18n, admin mode, scroll animations
// ============================================================================

const VM_IP = '<YOUR_VM_IP>';
const NIP = `${VM_IP}.nip.io`;
const TAMAGOTCHI_API = `http://demo.${NIP}/api`;
const SHOWCASE_API = window.location.origin;
const DEMO_SECRET = '<YOUR_DEMO_SECRET>';

// ---- i18n ----
const i18n = {
  en: {
    nav_home: 'Home', nav_architecture: 'Architecture', nav_infra: 'Live Infra',
    nav_demo: 'Demo App', nav_tools: 'Tools', nav_admin: '🔐 Admin',
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
    tool_gitea_actions: 'Native Continuous Integration pipeline compatible with GitHub Actions.', tool_sonarqube: 'Static code analysis to detect bugs, vulnerabilities, and code smells.', tool_linkerd: 'Ultralight Service Mesh providing observability, reliability, and security.', tool_public_login: 'Login via Gitea',
    footer_text: 'Built with K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hosted on Oracle Cloud Always Free (ARM Ampere A1).',
    footer_powered: 'Powered by determination & free cloud credits',
  },
  fr: {
    nav_home: 'Accueil', nav_architecture: 'Architecture', nav_infra: 'Infra Live',
    nav_demo: 'App Démo', nav_tools: 'Outils', nav_admin: '🔐 Admin',
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
    tool_gitea_actions: "Pipeline d'intégration continue native compatible avec GitHub Actions.", tool_sonarqube: "Analyse statique du code pour détecter bugs, vulnérabilités et mauvaises pratiques.", tool_linkerd: "Service Mesh ultra-léger offrant observabilité, fiabilité et sécurité.", tool_public_login: 'Connexion via Gitea',
    footer_text: "Construit avec K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hébergé sur Oracle Cloud Always Free (ARM Ampere A1).",
    footer_powered: 'Propulsé par la détermination et des crédits cloud gratuits',
  }
};

let currentLang = 'en';

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

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
  { cmd: 'kubectl get ingress --all-namespaces', output: [
    'NAMESPACE    NAME                 CLASS   HOSTS                          ADDRESS   PORTS',
    'argocd       argocd-ingress       nginx   argocd.<YOUR_VM_IP>.nip.io      80,443',
    'gitea        gitea-ingress        nginx   git.<YOUR_VM_IP>.nip.io         80',
    'monitoring   grafana              nginx   grafana.<YOUR_VM_IP>.nip.io     80',
    'tamagotchi   tamagotchi-ingress   nginx   demo.<YOUR_VM_IP>.nip.io        80',
  ]},
  { cmd: 'helm list --all-namespaces', output: [
    'NAME            NAMESPACE       STATUS    CHART',
    'ingress-nginx   ingress-nginx   deployed  ingress-nginx-4.12.2',
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
