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
    nav_heal: "♻️ Self-healing",
    demo_heal_link: "♻️ What happens when one dies →",
    heal_badge: "Self-healing",
    heal_title: "When a creature dies, <span class=\"gradient-text\">nobody gets woken up</span>",
    heal_subtitle: "Collecting metrics is the easy part. The gap between a dashboard and being on call is the alert — and what it triggers. Here is the full loop, running in production above, measured end to end.",
    heal_s1: "A business rule evaluates <code>max(tamagotchi_creatures_dead_total) &gt; 0</code> every 30s. The <code>for: 1m</code> is what stops a pod restart from triggering anything.",
    heal_s2: "Routing is done on <strong>labels</strong>, never on alert names. The rule carries <code>remediation: auto</code>, and that single label sends it to a machine instead of a human. Ten more alerts can be added tomorrow without touching the routing.",
    heal_s3: "A webhook workflow lists the creatures, keeps only the dead ones, revives them, and records what it did. A silent remediation is an outage you never learn about.",
    heal_s4_title: "The metric closes the loop",
    heal_s4: "The API updates the gauge, Prometheus scrapes it, the alert resolves on its own. Measured from death to revival, with no human involved: <strong>4 minutes 17 seconds</strong>.",
    heal_insight_title: "⚠️ The alert that actually matters is the second one",
    heal_insight: "Alerting only on the symptom is an anti-pattern: automation would repair it silently, the alert would always resolve itself, and the day the remediation breaks, nobody would know. So a second rule watches the remediation itself — if creatures are still dead ten minutes later, <code>TamagotchiSelfHealingFailed</code> goes critical and asks for a human. Knowing to alert on the failure of your automation, rather than on the incident it handles, is the difference between having read about SRE and having been on call.",
    heal_chips: "<span class=\"hire-chip\">PrometheusRule</span><span class=\"hire-chip\">AlertmanagerConfig</span><span class=\"hire-chip\">Label routing</span><span class=\"hire-chip\">Webhook remediation</span><span class=\"hire-chip\">Two-level alerting</span>",
    heal_link_rules: "📂 The alert rules →",
    heal_link_wf: "🤖 The n8n workflow →",
    slo_badge: 'SLO Board', slo_title: 'The <span class="gradient-text">99.9%</span> everyone claims, actually measured',
    slo_subtitle: "The alert chain above tells you when something breaks. An SLO tells you how much broken you can afford before it matters — and how much of that budget is already spent.",
    slo_explainer_title: '🎯 99.9% over 30 days = 43.2 minutes of budget, no more',
    slo_explainer: 'The SLI is request-based, not just <code>up</code>: <code>1 - (failed requests / total requests)</code>, summed over the window rather than averaged, because averaging ratios lies when traffic isn\'t flat. Two Prometheus recording rules compute it continuously — <code>tamagotchi:availability:ratio30d</code> and <code>tamagotchi:error_budget:consumed_ratio30d</code> — so Grafana only ever reads a pre-computed number, never re-runs a 30-day range query per dashboard load. The 30-day window is real, not decorative: Prometheus\'s own retention was bumped from 15 days to 30, and — since it turned out to be running on ephemeral storage — given a persistent volume so a pod restart doesn\'t reset the clock.',
    slo_link_rules: '📂 The recording rules →', slo_dashboard_label: 'Live SLO Dashboard',
    chaos_badge: 'Chaos Button', chaos_title: 'Break it yourself. <span class="gradient-text">Watch it heal.</span>',
    chaos_subtitle: 'Reading about resilience is not the same as watching it happen. This button deletes one real pod on the live cluster.',
    chaos_explainer: '<code>tamagotchi-api</code> runs 2 replicas behind a Kubernetes Service. Click the button and the backend deletes one pod by name through the Kubernetes API, using a Role scoped to exactly one verb (<code>delete</code>), one resource (<code>pods</code>), and one namespace (<code>tamagotchi</code>) — it cannot touch anything else in the cluster. The Deployment controller notices immediately and schedules a replacement. Watch the replica count dip and recover on the dashboard above, in the same window where the availability line doesn\'t move: that\'s the actual point — one replica absorbs the gap while the other is rescheduled, so nobody using the app notices.',
    chaos_btn_label: '💥 Kill a tamagotchi-api pod', chaos_ready_label: 'Ready replicas', chaos_desired_label: 'Desired replicas',
    chaos_note: 'Rate-limited to one kill per 30 seconds, capped per hour. This targets a stateless API pod only — not the database, not the frontend.',
    chaos_status_killing: 'Deleting a pod…', chaos_status_killed: 'Killed {pod} — watch it come back ↑', chaos_status_cooldown: 'Cooling down, try again in a few seconds', chaos_status_error: "Couldn't reach the cluster API",
    tool_n8n: "Receives Alertmanager webhooks and revives the dead creatures. This is the remediation step of the self-healing chain, not a demo.",
    tool_n8n_creds: "Private instance",
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
    tool_gitea_actions: 'Native Continuous Integration pipeline compatible with GitHub Actions.', tool_linkerd: 'Ultralight Service Mesh providing observability, reliability, and security.', tool_public_login: 'Login via Gitea',
    footer_text: 'Built with K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hosted on Oracle Cloud Always Free (ARM Ampere A1).',
    footer_powered: 'Powered by determination & free cloud credits',
    nav_about: '👤 About', nav_back: '← Back to Home',
    issues_badge: 'Troubleshooting', issues_title: 'Technical Issues Resolved', issues_subtitle: 'A deep dive into the engineering challenges faced and overcome while deploying this architecture on Oracle Cloud.',
    issues_hero_badge: 'Deep Dive Post-Mortem', issues_hero_title: 'Technical <span class="gradient-text">Issues Resolved</span>',
    issues_hero_desc: 'An in-depth look at the engineering challenges faced while deploying the microservices architecture on Oracle Cloud (ARM64). Discover the root causes, the exact error logs, and the terminal commands used to fix them.',
    issue_1_title: 'CI/CD Runner Network Isolation (Gitea Actions)',
    issue_1_symptom: 'CI job containers (via <code>act-runner</code>) failed to <code>git clone</code> or push Docker images, throwing what looked like an authentication error against the internal Gitea service.',
    issue_1_discarded: 'The error read <code>Invalid username or password</code>, so we first regenerated the Gitea token — no change. Then suspected DNS resolution of <code>.svc.cluster.local</code> and patched <code>/etc/hosts</code> in the runner — the timeouts softened but never fully cleared, which was the tell that DNS wasn\'t the real story.',
    issue_1_cause: 'The standard Docker bridge network created by <code>act-runner</code> suffered from MTU fragmentation and NAT translation issues when communicating with K3s Pod IPs and Services on this specific Oracle Cloud virtualized network — the auth-shaped error was just how the connection drop surfaced.',
    issue_1_fix: 'We configured the Gitea <code>act-runner</code> to force all CI job containers onto the host\'s network namespace, letting ephemeral CI containers resolve <code>.svc.cluster.local</code> domains directly, without NAT overhead.',
    issue_1_lesson: 'An authentication-shaped error message doesn\'t mean an authentication problem. When the same credentials work fine outside the automated environment, check the transport layer — MTU, routing, NAT — before touching tokens again.',
    issue_2_title: 'ArgoCD gRPC Interference with Linkerd',
    issue_2_symptom: 'ArgoCD became completely inaccessible, returning <code>502 Bad Gateway</code>. The <code>argocd-server</code> logs were filled with TLS handshake failures.',
    issue_2_discarded: 'A 502 usually means a routing problem, so we first re-checked the Gateway/HTTPRoute config and the certificate — both correct. Then suspected <code>argocd-server</code> itself was crash-looping — but every ArgoCD pod was <code>Running</code> and <code>Ready</code>.',
    issue_2_cause: 'Installing the Linkerd service mesh had globally auto-injected sidecars into the ArgoCD namespace. Linkerd aggressively intercepts gRPC traffic, and ArgoCD relies heavily on internal gRPC between its server, repo-server, and application-controller — the proxy was breaking their TLS handshakes.',
    issue_2_fix: 'We disabled Linkerd proxy injection specifically for the ArgoCD namespace and recreated the pods to restore internal communication.',
    issue_2_lesson: 'Sidecar injection is a namespace-level decision to make before installing anything into that namespace, not a bug to fix afterward. The Ansible role now annotates <code>argocd</code> with <code>linkerd.io/inject=disabled</code> before ArgoCD is ever installed, so this can\'t recur by ordering alone.',
    issue_3_title: 'GitOps Manifest Push Authentication',
    issue_3_symptom: 'Right after a successful image build, the pipeline failed at the manifest-update step with <code>Invalid username or password. fatal: Authentication failed</code>.',
    issue_3_discarded: 'We first assumed the token had expired and regenerated it — same failure. Then suspected a branch-protection rule blocking the push — none was configured on that repository.',
    issue_3_cause: 'The default token injected by Gitea Actions was insufficient for pushing back to the repository from within that specific job\'s context over HTTPS — a scope problem, not an expiry or policy one.',
    issue_3_fix: 'We modified <code>.gitea/workflows/deploy.yaml</code> to inject a dedicated access token directly into the remote URL before executing the push.',
    issue_3_lesson: 'A token being present and valid isn\'t the same as a token being scoped for the operation you\'re about to run. Check what the credential is actually allowed to do, not just whether it exists.',
    issue_4_title: 'ImagePullPolicy Stale Caching',
    issue_4_symptom: 'ArgoCD reported the new manifest as <code>Synced</code>, but the running pods kept serving an old image — no error, just stale behavior.',
    issue_4_discarded: 'We first assumed ArgoCD hadn\'t actually synced and re-triggered it manually — no change. Then diffed the image tag in the manifest against what was built — they matched exactly.',
    issue_4_cause: 'The registry was configured as the internal service <code>gitea-http.gitea.svc.cluster.local:3000</code>, which K3s\'s containerd resolved and authenticated inconsistently. With <code>imagePullPolicy: IfNotPresent</code>, once any pull had ever succeeded, later pulls silently kept the cached layer instead of failing loudly.',
    issue_4_fix: 'We switched the registry target to the external, reliably resolvable domain and set <code>imagePullPolicy: Always</code> to force strict layer validation on every deploy.',
    issue_4_lesson: '<code>IfNotPresent</code> is an availability optimization, not a correctness guarantee. For anything still iterating fast, the extra pull time <code>Always</code> costs is cheap insurance against an entire class of "it deployed but didn\'t actually update" incidents.',
    issue_5_title: 'ArgoCD RBAC "Guest" Credentials',
    issue_5_symptom: 'The showcase site advertised <code>guest</code> / a demo password for ArgoCD, but every login attempt was rejected.',
    issue_5_discarded: 'We first suspected the <code>argocd-rbac-cm</code> policy mapping itself — read it line by line, syntax was correct. Then checked whether the guest account was even enabled — it was.',
    issue_5_cause: 'RBAC and the account definition were both fine; the bcrypt password hash for <code>accounts.guest.password</code> in the separate <code>argocd-secret</code> object was missing.',
    issue_5_fix: 'We generated a bcrypt hash manually via Python, base64-encoded it, and patched <code>argocd-secret</code> directly.',
    issue_5_lesson: 'ArgoCD splits "is this account allowed to exist and what can it do" (the RBAC ConfigMap) from "can it prove who it is" (the Secret). A login failure is ambiguous between the two until both are checked — RBAC looking correct doesn\'t clear the second one.',
    issue_6_title: 'Node.js vs Nginx Port Bindings',
    issue_6_symptom: 'A routine CSS update brought down the entire site with <code>502 Bad Gateway</code>, including the live cluster metrics normally embedded on the homepage.',
    issue_6_discarded: 'Since the change that triggered it was CSS, we first suspected the content itself — but a 502 happens before any HTML is served, which ruled that out as soon as we actually looked at where the error originated.',
    issue_6_cause: 'The build had picked up an older Nginx-based Dockerfile (listening on port 80) instead of the Node.js one, while the Kubernetes Service still targeted port 3000 — a silent mismatch between what got built and what the Service expected.',
    issue_6_fix: 'We restored the Node.js <code>server.js</code> proxy architecture, rebuilt via <code>nerdctl</code>, and rolled out the corrected image.',
    issue_6_lesson: 'The real fix wasn\'t restoring the right file once — it was removing the alternate Dockerfile so it can\'t be picked up by accident again. <code>website/nginx.conf</code> still exists in this repo as a reference, but nothing in the build path touches it.',
    issue_7_title: 'Grafana Persistence & Legacy Ingress Cleanup',
    issue_7_symptom: 'Dashboards, users, and settings created by hand in the Grafana UI vanished on every pod restart. Separately, stray <code>Ingress</code> objects from Helm chart defaults were still routing traffic outside the intended Gateway API path.',
    issue_7_discarded: 'We first assumed a Helm values change had been silently reverted — reviewed release history, values were consistent across upgrades. Then suspected the dashboards-as-code sidecar (the same <code>grafana_dashboard: "1"</code> ConfigMap pattern used for Tamagotchi and Loki) was overwriting manually-created dashboards — but the provisioned ones always survived restarts fine; only the hand-made ones vanished, which pointed at storage, not provisioning.',
    issue_7_cause: 'Grafana\'s chart defaults to an ephemeral <code>emptyDir</code> volume: every pod restart started from a blank <code>data.db</code>, wiping anything not defined as versioned config.',
    issue_7_fix: 'We deployed a dedicated <code>hostPath</code> PersistentVolume and PVC for Grafana and pointed the Helm release at it (<code>helm upgrade --reuse-values</code>), then separately deleted the ghost <code>Ingress</code> objects to fully hand routing to <code>HTTPRoute</code>.',
    issue_7_lesson: 'Dashboards-as-code never needed this fix at all — it doesn\'t depend on Grafana\'s own storage. This was the first of what turned out to be a recurring pattern on this cluster: a stateful workload quietly running on ephemeral storage. The Valkey/Gitea outage of 2026-08-08 was the same bug in a different pod — see the runbook.',
    issue_8_title: 'UI Translation Race Condition (i18n Bug)',
    issue_8_symptom: 'Switching language on the site sometimes rendered raw keys like <code>issues_title</code> instead of actual text.',
    issue_8_discarded: 'The name we gave the bug shaped the first hypothesis: a load-order race between <code>setLang()</code> and the dictionaries being defined. We added a <code>DOMContentLoaded</code> guard — the affected strings still broke. Then suspected stale cached JS — hard-refreshed, same result.',
    issue_8_cause: 'There was no timing bug at all. The keys were simply never defined in one or both dictionaries for that section of the page, so <code>setLang()</code> had nothing to find and fell back to printing the raw key.',
    issue_8_fix: 'We added the missing keys to both the <code>en</code> and <code>fr</code> dictionaries in <code>app.js</code>.',
    issue_8_lesson: 'The incident\'s own name was the first, misleading hypothesis, and it stuck as the title even after the real cause turned out to be simpler than a race. Worth naming a postmortem after the root cause is known, not before.',
    issue_9_title: 'K3s ErrImageNeverPull & Local Containerd Sockets',
    issue_9_symptom: 'After rebuilding the website image locally to ship a frontend change, the deployment failed with <code>ErrImageNeverPull</code> — as if the image had never been built at all.',
    issue_9_discarded: 'We first assumed the build itself had silently failed — reran it, watched it complete, confirmed the tag existed locally. Then diffed the build tag against the Deployment\'s <code>image:</code> field — they matched exactly.',
    issue_9_cause: '<code>nerdctl build</code> had run against the default containerd socket and namespace. K3s runs its own isolated containerd, at <code>/run/k3s/containerd/containerd.sock</code> in the <code>k8s.io</code> namespace — the kubelet simply couldn\'t see an image built anywhere else.',
    issue_9_fix: 'We rebuilt the image directly into K3s\'s containerd: <code>nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build ...</code>.',
    issue_9_lesson: '"The image doesn\'t exist" and "the image exists somewhere the kubelet can\'t see" produce the exact same error. Worth checking which containerd socket a build actually landed in before assuming the build is broken — this is the exact command now used for every website rebuild on this cluster.',
    issue_10_title: 'Git Commit Hanging Indefinitely (GPG Signing)',
    issue_10_symptom: 'Automated <code>git commit</code> calls from a headless terminal session hung indefinitely — no error, no visible prompt, until the surrounding task eventually timed out.',
    issue_10_discarded: 'We first suspected a network hang — a pre-commit hook reaching out somewhere. There were no hooks installed. Then checked whether the process was deadlocked or spinning — it was idle, just blocked waiting on input.',
    issue_10_cause: '<code>commit.gpgsign=true</code> was set globally. Git was waiting on a GPG passphrase prompt that had nowhere to render in that headless context.',
    issue_10_fix: 'Documented as <code>--no-gpg-sign</code> per commit, to unblock the immediate incident.',
    issue_10_lesson: 'This is a workaround, not a fix, and worth naming as such: bypassing signing per-command trades a hang for a silent gap in provenance. The durable version of this fix is a signing setup built for non-interactive contexts — an agent-cached key or SSH-based commit signing — or an explicit decision that automated commits on this repo are unsigned, made once, not re-decided on every hang.',
    badge_symptom: 'Symptom', badge_discarded: 'Discarded Hypotheses', badge_cause: 'Root Cause', badge_fix: 'Fix', badge_lesson: 'Lesson',
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
    nav_heal: "♻️ Auto-réparation",
    demo_heal_link: "♻️ Que se passe-t-il quand elles meurent →",
    heal_badge: "Auto-réparation",
    heal_title: "Quand une créature meurt, <span class=\"gradient-text\">personne n'est réveillé</span>",
    heal_subtitle: "Collecter des métriques est la partie facile. Ce qui sépare un tableau de bord d'une astreinte, c'est l'alerte — et ce qu'elle déclenche. Voici la boucle complète, en production juste au-dessus, mesurée de bout en bout.",
    heal_s1: "Une règle métier évalue <code>max(tamagotchi_creatures_dead_total) &gt; 0</code> toutes les 30s. Le <code>for: 1m</code> est ce qui empêche un simple redémarrage de pod de déclencher quoi que ce soit.",
    heal_s2: "Le routage se fait sur les <strong>labels</strong>, jamais sur le nom des alertes. La règle porte <code>remediation: auto</code>, et ce seul label l'envoie vers une machine plutôt que vers un humain. Dix alertes de plus demain, sans toucher au routage.",
    heal_s3: "Un workflow déclenché par webhook liste les créatures, ne garde que les mortes, les ranime, et trace ce qu'il a fait. Une remédiation silencieuse est une panne qu'on n'apprend jamais.",
    heal_s4_title: "La métrique referme la boucle",
    heal_s4: "L'API met à jour la jauge, Prometheus la collecte, l'alerte se résout seule. Mesuré de la mort à la ranimation, sans aucune intervention humaine : <strong>4 minutes 17 secondes</strong>.",
    heal_insight_title: "⚠️ L'alerte qui compte vraiment est la seconde",
    heal_insight: "N'alerter que sur le symptôme est un anti-pattern : l'automatisation réparerait en silence, l'alerte se résoudrait toujours d'elle-même, et le jour où la remédiation casse, personne ne le saurait. Une seconde règle surveille donc la remédiation elle-même : si des créatures sont encore mortes dix minutes plus tard, <code>TamagotchiSelfHealingFailed</code> passe en critique et réclame un humain. Savoir alerter sur l'échec de son automatisation, plutôt que sur l'incident qu'elle traite, c'est la différence entre avoir lu des livres sur le SRE et avoir été d'astreinte.",
    heal_chips: "<span class=\"hire-chip\">PrometheusRule</span><span class=\"hire-chip\">AlertmanagerConfig</span><span class=\"hire-chip\">Routage par label</span><span class=\"hire-chip\">Remédiation par webhook</span><span class=\"hire-chip\">Alerte à deux niveaux</span>",
    heal_link_rules: "📂 Les règles d'alerte →",
    heal_link_wf: "🤖 Le workflow n8n →",
    slo_badge: 'Tableau SLO', slo_title: 'Les <span class="gradient-text">99,9%</span> que tout le monde revendique, enfin mesurés',
    slo_subtitle: "La chaîne d'alerte ci-dessus dit quand quelque chose casse. Un SLO dit combien de casse on peut se permettre avant que ça compte — et combien de ce budget est déjà dépensé.",
    slo_explainer_title: '🎯 99,9% sur 30 jours = 43,2 minutes de budget, pas plus',
    slo_explainer: "Le SLI est basé sur les requêtes, pas seulement sur <code>up</code> : <code>1 - (requêtes échouées / requêtes totales)</code>, sommé sur la fenêtre plutôt que moyenné, parce que moyenner des ratios ment quand le trafic n'est pas plat. Deux règles d'enregistrement Prometheus le calculent en continu — <code>tamagotchi:availability:ratio30d</code> et <code>tamagotchi:error_budget:consumed_ratio30d</code> — donc Grafana ne fait jamais que lire un nombre déjà calculé, sans jamais rejouer une requête sur 30 jours à chaque chargement du dashboard. La fenêtre de 30 jours est réelle, pas décorative : la rétention de Prometheus est passée de 15 à 30 jours, et — comme il s'est avéré qu'il tournait sur du stockage éphémère — il a reçu un volume persistant pour qu'un redémarrage de pod ne remette plus le compteur à zéro.",
    slo_link_rules: "📂 Les règles d'enregistrement →", slo_dashboard_label: 'Dashboard SLO en direct',
    chaos_badge: 'Bouton Chaos', chaos_title: 'Casse-le toi-même. <span class="gradient-text">Regarde-le guérir.</span>',
    chaos_subtitle: "Lire sur la résilience, ce n'est pas la même chose que la voir se produire. Ce bouton supprime un vrai pod sur le cluster en production.",
    chaos_explainer: "<code>tamagotchi-api</code> tourne en 2 réplicas derrière un Service Kubernetes. Cliquer sur le bouton fait supprimer un pod par son nom, par le backend, via l'API Kubernetes, avec un Role scopé à exactement un verbe (<code>delete</code>), une ressource (<code>pods</code>) et un namespace (<code>tamagotchi</code>) — il ne peut toucher à rien d'autre sur le cluster. Le contrôleur du Deployment le remarque immédiatement et planifie un remplaçant. Regarde le compteur de réplicas plonger puis remonter sur le dashboard ci-dessus, dans la même fenêtre où la ligne de disponibilité ne bouge pas : c'est exactement le point — un réplica absorbe l'écart pendant que l'autre est replanifié, donc personne qui utilise l'app ne remarque rien.",
    chaos_btn_label: '💥 Supprimer un pod tamagotchi-api', chaos_ready_label: 'Réplicas prêts', chaos_desired_label: 'Réplicas désirés',
    chaos_note: "Limité à une suppression toutes les 30 secondes, plafonné par heure. Cible uniquement un pod d'API sans état — jamais la base de données, jamais le frontend.",
    chaos_status_killing: 'Suppression d\'un pod…', chaos_status_killed: '{pod} supprimé — regarde-le revenir ↑', chaos_status_cooldown: 'Recharge en cours, réessaie dans quelques secondes', chaos_status_error: "Impossible de joindre l'API du cluster",
    tool_n8n: "Reçoit les webhooks d'Alertmanager et ranime les créatures mortes. C'est l'étage de remédiation de la chaîne d'auto-réparation, pas une démo.",
    tool_n8n_creds: "Instance privée",
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
    tool_gitea_actions: "Pipeline d'intégration continue native compatible avec GitHub Actions.", tool_linkerd: "Service Mesh ultra-léger offrant observabilité, fiabilité et sécurité.", tool_public_login: 'Connexion via Gitea',
    footer_text: "Construit avec K3s, ArgoCD, Prometheus, Grafana, Loki & Gitea — hébergé sur Oracle Cloud Always Free (ARM Ampere A1).",
    footer_powered: 'Propulsé par la détermination et des crédits cloud gratuits',
    nav_about: '👤 À propos', nav_back: '← Retour à l\'Accueil',
    issues_badge: 'Dépannage', issues_title: 'Problèmes Techniques Résolus', issues_subtitle: 'Une plongée approfondie dans les défis d\'ingénierie rencontrés et surmontés lors du déploiement de cette architecture sur Oracle Cloud.',
    issues_hero_badge: 'Analyse Approfondie Post-Mortem', issues_hero_title: 'Problèmes Techniques <span class="gradient-text">Résolus</span>',
    issues_hero_desc: 'Un regard approfondi sur les défis d\'ingénierie rencontrés lors du déploiement de l\'architecture microservices sur Oracle Cloud (ARM64). Découvrez les causes racines, les logs d\'erreurs exacts et les commandes terminales utilisées pour les corriger.',
    issue_1_title: 'Isolation Réseau du Runner CI/CD (Gitea Actions)',
    issue_1_symptom: 'Les conteneurs de job CI (via <code>act-runner</code>) échouaient à <code>git clone</code> ou à push les images Docker, avec une erreur qui ressemblait à un problème d\'authentification contre le service Gitea interne.',
    issue_1_discarded: 'L\'erreur affichait <code>Invalid username or password</code>, donc nous avons d\'abord régénéré le token Gitea — aucun changement. Puis suspecté la résolution DNS de <code>.svc.cluster.local</code> et patché <code>/etc/hosts</code> dans le runner — les timeouts se sont adoucis sans jamais disparaître complètement, ce qui indiquait que le DNS n\'était pas la vraie histoire.',
    issue_1_cause: 'Le réseau bridge Docker standard créé par <code>act-runner</code> souffrait de fragmentation MTU et de problèmes de traduction NAT lors de la communication avec les IP de Pods et Services K3s sur ce réseau virtualisé Oracle Cloud — l\'erreur en forme d\'authentification n\'était que la façon dont la coupure de connexion remontait.',
    issue_1_fix: 'Nous avons configuré le <code>act-runner</code> de Gitea pour forcer tous les conteneurs de job CI sur le namespace réseau de l\'hôte, permettant aux conteneurs CI éphémères de résoudre directement les domaines <code>.svc.cluster.local</code>, sans surcharge NAT.',
    issue_1_lesson: 'Une erreur en forme d\'authentification ne veut pas dire un problème d\'authentification. Quand les mêmes identifiants fonctionnent sans problème hors de l\'environnement automatisé, vérifier la couche transport — MTU, routage, NAT — avant de retoucher aux tokens.',
    issue_2_title: 'Interférence gRPC d\'ArgoCD avec Linkerd',
    issue_2_symptom: 'ArgoCD est devenu complètement inaccessible, renvoyant <code>502 Bad Gateway</code>. Les logs <code>argocd-server</code> étaient remplis d\'échecs de handshake TLS.',
    issue_2_discarded: 'Un 502 signifie généralement un problème de routage, donc nous avons d\'abord revérifié la config Gateway/HTTPRoute et le certificat — tous deux corrects. Puis suspecté que <code>argocd-server</code> lui-même crashait en boucle — mais tous les pods ArgoCD étaient <code>Running</code> et <code>Ready</code>.',
    issue_2_cause: 'L\'installation du service mesh Linkerd avait injecté globalement des sidecars dans le namespace ArgoCD. Linkerd intercepte agressivement le trafic gRPC, et ArgoCD s\'appuie fortement sur du gRPC interne entre son server, repo-server et application-controller — le proxy cassait leurs handshakes TLS.',
    issue_2_fix: 'Nous avons désactivé l\'injection de proxy Linkerd spécifiquement pour le namespace ArgoCD et recréé les pods pour restaurer la communication interne.',
    issue_2_lesson: 'L\'injection de sidecar est une décision à prendre au niveau du namespace avant d\'y installer quoi que ce soit, pas un bug à corriger après coup. Le rôle Ansible annote désormais <code>argocd</code> avec <code>linkerd.io/inject=disabled</code> avant même qu\'ArgoCD soit installé, pour que ça ne puisse plus se reproduire, par simple ordre d\'exécution.',
    issue_3_title: 'Authentification Push Manifeste GitOps',
    issue_3_symptom: 'Juste après un build d\'image réussi, la pipeline échouait à l\'étape de mise à jour du manifeste avec <code>Invalid username or password. fatal: Authentication failed</code>.',
    issue_3_discarded: 'Nous avons d\'abord supposé que le token avait expiré et l\'avons régénéré — même échec. Puis suspecté une règle de protection de branche bloquant le push — aucune n\'était configurée sur ce dépôt.',
    issue_3_cause: 'Le token par défaut injecté par Gitea Actions était insuffisant pour repousser vers le dépôt depuis le contexte de ce job précis en HTTPS — un problème de scope, pas d\'expiration ni de politique.',
    issue_3_fix: 'Nous avons modifié <code>.gitea/workflows/deploy.yaml</code> pour injecter un token d\'accès dédié directement dans l\'URL distante avant d\'exécuter le push.',
    issue_3_lesson: 'Qu\'un token soit présent et valide n\'est pas la même chose qu\'un token dont le scope couvre l\'opération qu\'on s\'apprête à lancer. Vérifier ce que l\'identifiant a le droit de faire, pas seulement s\'il existe.',
    issue_4_title: 'Mise en Cache Obsolète ImagePullPolicy',
    issue_4_symptom: 'ArgoCD annonçait le nouveau manifeste comme <code>Synced</code>, mais les pods en cours servaient toujours une ancienne image — aucune erreur, juste un comportement obsolète.',
    issue_4_discarded: 'Nous avons d\'abord supposé qu\'ArgoCD n\'avait pas réellement synchronisé et redéclenché manuellement — aucun changement. Puis comparé le tag d\'image du manifeste avec celui du build — ils étaient identiques.',
    issue_4_cause: 'Le registre était configuré comme le service interne <code>gitea-http.gitea.svc.cluster.local:3000</code>, que le containerd de K3s résolvait et authentifiait de façon incohérente. Avec <code>imagePullPolicy: IfNotPresent</code>, une fois qu\'un pull avait réussi une fois, les suivants gardaient silencieusement la couche en cache au lieu d\'échouer bruyamment.',
    issue_4_fix: 'Nous avons basculé la cible du registre vers le domaine externe, résolu de façon fiable, et défini <code>imagePullPolicy: Always</code> pour forcer une validation stricte des couches à chaque déploiement.',
    issue_4_lesson: '<code>IfNotPresent</code> est une optimisation de disponibilité, pas une garantie de correction. Pour tout ce qui itère encore vite, le temps de pull supplémentaire coûté par <code>Always</code> est une assurance bon marché contre toute une classe d\'incidents du type « c\'est déployé mais ça n\'a pas vraiment changé ».',
    issue_5_title: 'Identifiants "Guest" RBAC ArgoCD',
    issue_5_symptom: 'Le site vitrine annonçait <code>guest</code> / un mot de passe de démo pour ArgoCD, mais chaque tentative de connexion était rejetée.',
    issue_5_discarded: 'Nous avons d\'abord suspecté le mapping de policy <code>argocd-rbac-cm</code> lui-même — relu ligne par ligne, syntaxe correcte. Puis vérifié si le compte guest était même activé — il l\'était.',
    issue_5_cause: 'Le RBAC et la définition du compte étaient corrects tous les deux ; c\'est le hash bcrypt du mot de passe pour <code>accounts.guest.password</code>, dans l\'objet <code>argocd-secret</code> séparé, qui manquait.',
    issue_5_fix: 'Nous avons généré un hash bcrypt manuellement via Python, l\'avons encodé en base64, et avons patché <code>argocd-secret</code> directement.',
    issue_5_lesson: 'ArgoCD sépare « ce compte a-t-il le droit d\'exister et de faire quoi » (le ConfigMap RBAC) de « peut-il prouver qui il est » (le Secret). Un échec de connexion reste ambigu entre les deux tant qu\'on n\'a pas vérifié les deux — un RBAC qui semble correct ne dédouane pas le second.',
    issue_6_title: 'Conflits de Ports Node.js vs Nginx',
    issue_6_symptom: 'Une mise à jour CSS de routine a fait tomber tout le site avec <code>502 Bad Gateway</code>, y compris les métriques cluster en direct normalement intégrées sur la page d\'accueil.',
    issue_6_discarded: 'Comme le changement déclencheur était du CSS, nous avons d\'abord suspecté le contenu lui-même — mais un 502 survient avant que le moindre HTML soit servi, ce qui a écarté cette piste dès qu\'on a regardé où l\'erreur naissait réellement.',
    issue_6_cause: 'Le build avait repris un ancien Dockerfile basé sur Nginx (écoutant sur le port 80) au lieu de celui en Node.js, alors que le Service Kubernetes ciblait toujours le port 3000 — une incohérence silencieuse entre ce qui avait été construit et ce que le Service attendait.',
    issue_6_fix: 'Nous avons restauré l\'architecture proxy Node.js <code>server.js</code>, reconstruit via <code>nerdctl</code>, et déployé l\'image corrigée.',
    issue_6_lesson: 'Le vrai fix n\'était pas de restaurer le bon fichier une fois — c\'était de supprimer le Dockerfile alternatif pour qu\'il ne puisse plus être repris par accident. <code>website/nginx.conf</code> existe toujours dans ce dépôt comme référence, mais rien dans le chemin de build n\'y touche.',
    issue_7_title: 'Persistance Grafana & Nettoyage des Ingress Historiques',
    issue_7_symptom: 'Les dashboards, utilisateurs et réglages créés à la main dans l\'UI Grafana disparaissaient à chaque redémarrage de pod. Séparément, des objets <code>Ingress</code> résiduels issus des valeurs par défaut d\'un chart Helm continuaient de router du trafic en dehors du chemin Gateway API prévu.',
    issue_7_discarded: 'Nous avons d\'abord supposé qu\'un changement de valeurs Helm avait été silencieusement annulé — revu l\'historique des releases, les valeurs étaient cohérentes d\'une mise à jour à l\'autre. Puis suspecté que le sidecar de dashboards-as-code (le même pattern de ConfigMap <code>grafana_dashboard: "1"</code> utilisé pour Tamagotchi et Loki) écrasait les dashboards créés à la main — mais ceux provisionnés survivaient toujours aux redémarrages sans problème ; seuls ceux faits à la main disparaissaient, ce qui pointait vers le stockage, pas le provisioning.',
    issue_7_cause: 'Le chart Grafana utilise par défaut un volume <code>emptyDir</code> éphémère : chaque redémarrage de pod repartait d\'un <code>data.db</code> vierge, effaçant tout ce qui n\'était pas défini comme config versionnée.',
    issue_7_fix: 'Nous avons déployé un PersistentVolume et une PVC <code>hostPath</code> dédiés pour Grafana et pointé la release Helm dessus (<code>helm upgrade --reuse-values</code>), puis séparément supprimé les objets <code>Ingress</code> fantômes pour rendre le routage entièrement à <code>HTTPRoute</code>.',
    issue_7_lesson: 'Le dashboards-as-code n\'a jamais eu besoin de ce fix — il ne dépend pas du stockage propre de Grafana. Ça a été le premier épisode d\'un pattern qui s\'est révélé récurrent sur ce cluster : une charge avec état tournant discrètement sur du stockage éphémère. La panne Valkey/Gitea du 2026-08-08 était exactement le même bug, dans un autre pod — voir le runbook.',
    issue_8_title: 'Race Condition de Traduction UI (Bug i18n)',
    issue_8_symptom: 'Changer de langue sur le site affichait parfois des clés brutes comme <code>issues_title</code> au lieu du texte réel.',
    issue_8_discarded: 'Le nom donné au bug a orienté la première hypothèse : une race de timing entre <code>setLang()</code> et la définition des dictionnaires. Nous avons ajouté une garde <code>DOMContentLoaded</code> — les chaînes concernées restaient cassées. Puis suspecté un JS mis en cache par le navigateur — rechargement forcé, même résultat.',
    issue_8_cause: 'Il n\'y avait aucun bug de timing. Les clés n\'étaient tout simplement jamais définies dans l\'un des deux dictionnaires (ou les deux) pour cette section de la page, donc <code>setLang()</code> n\'avait rien à trouver et retombait sur l\'affichage de la clé brute.',
    issue_8_fix: 'Nous avons ajouté les clés manquantes aux deux dictionnaires <code>en</code> et <code>fr</code> dans <code>app.js</code>.',
    issue_8_lesson: 'Le nom de l\'incident était lui-même la première hypothèse, trompeuse, et il est resté comme titre même après que la vraie cause se soit révélée plus simple qu\'une race. Mieux vaut nommer un post-mortem une fois la cause racine connue, pas avant.',
    issue_9_title: 'ErrImageNeverPull K3s & Sockets Containerd Locaux',
    issue_9_symptom: 'Après avoir reconstruit l\'image du site localement pour livrer un changement frontend, le déploiement a échoué avec <code>ErrImageNeverPull</code> — comme si l\'image n\'avait jamais été construite.',
    issue_9_discarded: 'Nous avons d\'abord supposé que le build lui-même avait silencieusement échoué — relancé, observé qu\'il se terminait, confirmé que le tag existait localement. Puis comparé le tag du build avec le champ <code>image:</code> du Deployment — ils étaient identiques.',
    issue_9_cause: '<code>nerdctl build</code> avait tourné contre le socket et le namespace containerd par défaut. K3s fait tourner son propre containerd isolé, sur <code>/run/k3s/containerd/containerd.sock</code> dans le namespace <code>k8s.io</code> — le kubelet ne pouvait tout simplement pas voir une image construite ailleurs.',
    issue_9_fix: 'Nous avons reconstruit l\'image directement dans le containerd de K3s : <code>nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build ...</code>.',
    issue_9_lesson: '« L\'image n\'existe pas » et « l\'image existe quelque part que le kubelet ne voit pas » produisent exactement la même erreur. Mieux vaut vérifier dans quel socket containerd un build a réellement atterri avant de supposer que le build est cassé — c\'est exactement la commande utilisée aujourd\'hui pour chaque reconstruction du site sur ce cluster.',
    issue_10_title: 'Git Commit Bloqué Indéfiniment (Signature GPG)',
    issue_10_symptom: 'Des appels <code>git commit</code> automatisés depuis une session terminal headless restaient bloqués indéfiniment — aucune erreur, aucun prompt visible, jusqu\'à ce que la tâche englobante finisse par timeout.',
    issue_10_discarded: 'Nous avons d\'abord suspecté un blocage réseau — un hook pre-commit contactant quelque chose. Aucun hook n\'était installé. Puis vérifié si le process était en deadlock ou en boucle active — il était inactif, simplement bloqué en attente d\'une entrée.',
    issue_10_cause: '<code>commit.gpgsign=true</code> était configuré globalement. Git attendait un prompt de passphrase GPG qui n\'avait nulle part où s\'afficher dans ce contexte headless.',
    issue_10_fix: 'Documenté comme <code>--no-gpg-sign</code> par commit, pour débloquer l\'incident dans l\'immédiat.',
    issue_10_lesson: 'C\'est un contournement, pas un fix, et ça mérite d\'être nommé comme tel : bypasser la signature à chaque commande échange un blocage contre un trou silencieux dans la provenance. La version durable de ce fix est une configuration de signature pensée pour un contexte non interactif — une clé mise en cache par un agent, ou une signature de commit basée SSH — ou une décision explicite, prise une fois, que les commits automatisés sur ce dépôt restent non signés, plutôt que re-décidée à chaque blocage.',
    badge_symptom: 'Symptôme', badge_discarded: 'Hypothèses écartées', badge_cause: 'Cause racine', badge_fix: 'Fix', badge_lesson: 'Enseignement',
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

const SUPPORTED_LANGS = Object.keys(i18n); // ['en', 'fr']

// Choisir la langue au premier chargement : le choix precedent de ce
// visiteur d'abord, sinon la langue du navigateur, sinon l'anglais. Sans
// persistance, passer en francais puis naviguer vers about.html repassait
// tout en anglais — deroutant, et invisible tant qu'on ne change pas de page.
function detectInitialLang() {
  const saved = localStorage.getItem('lang');
  if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  const browserLang = (navigator.language || 'en').slice(0, 2);
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'en';
}

let currentLang = detectInitialLang();

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key;
}

// Rempli par initArchTooltips() si une infobulle est ouverte au moment du
// changement de langue, pour la rafraîchir plutôt que de la laisser périmée.
let onLangChange = null;

function setLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  if (onLangChange) onLangChange();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// Applique tout de suite la langue detectee : sans cet appel, currentLang
// pouvait valoir 'fr' en interne alors que le HTML restait en anglais
// jusqu'au premier clic sur le selecteur.
setLang(currentLang);

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
  // Comme animateTerminal(), n'existe que sur index.html : sans cette garde
  // c'était une exception non gérée à chaque chargement de about.html/issues.html.
  if (!document.getElementById('cpuFill')) return;
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

    // Chaos Button replica counters piggyback on this same /api/infra call
    // rather than polling separately: /api/infra already lists every pod,
    // "ready" = tamagotchi-api pods currently Running, "desired" = all of
    // them regardless of phase (Kubernetes keeps a Pending/ContainerCreating
    // replacement pod object alive within moments of a delete, so the total
    // count stays ~2 almost continuously even while "ready" briefly dips).
    const chaosReadyEl = document.getElementById('chaosReady');
    if (chaosReadyEl && data.pods) {
      const apiPods = data.pods.filter(p => p.ns === 'tamagotchi' && p.name.startsWith('tamagotchi-api-'));
      chaosReadyEl.textContent = apiPods.filter(p => p.status === 'Running').length;
      document.getElementById('chaosDesired').textContent = apiPods.length || '—';
    }

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

// ---- Chaos Button ----
// Matches CHAOS_COOLDOWN_MS in website/server.js — the button stays disabled
// client-side for the same window the backend actually enforces, so a click
// during cooldown never round-trips just to be told no.
const CHAOS_COOLDOWN_MS = 30000;
let chaosPollTimer = null;

// A short fast-polling burst right after a kill, not a permanent interval:
// this is the only moment the replica dip/recovery is worth refreshing more
// than once. Piggybacks on populateInfraData() rather than a second endpoint.
function pollChaosReplicasBurst(durationMs = 20000, everyMs = 2000) {
  if (chaosPollTimer) clearInterval(chaosPollTimer);
  const stopAt = Date.now() + durationMs;
  chaosPollTimer = setInterval(() => {
    populateInfraData();
    if (Date.now() >= stopAt) { clearInterval(chaosPollTimer); chaosPollTimer = null; }
  }, everyMs);
}

const chaosBtn = document.getElementById('chaosBtn');
if (chaosBtn) {
  chaosBtn.addEventListener('click', async () => {
    const statusEl = document.getElementById('chaosStatus');
    chaosBtn.disabled = true;
    statusEl.className = 'chaos-panel__status';
    statusEl.textContent = t('chaos_status_killing');
    try {
      const res = await fetch('/api/chaos/kill-pod', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        statusEl.textContent = t('chaos_status_cooldown');
        statusEl.className = 'chaos-panel__status chaos-panel__status--err';
      } else if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      } else {
        statusEl.textContent = t('chaos_status_killed').replace('{pod}', data.killed);
        statusEl.className = 'chaos-panel__status chaos-panel__status--ok';
        pollChaosReplicasBurst();
      }
    } catch (e) {
      statusEl.textContent = t('chaos_status_error');
      statusEl.className = 'chaos-panel__status chaos-panel__status--err';
    } finally {
      setTimeout(() => { chaosBtn.disabled = false; }, CHAOS_COOLDOWN_MS);
    }
  });
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
// adminBtn/adminModal/adminForm n'existent que sur index.html. Y accéder sans
// garde levait une TypeError sur about.html/issues.html qui coupait le script
// à cette ligne : tout le code plus bas (scroll, nav active, onglets, menu
// hamburger) ne s'exécutait jamais sur ces deux pages.
const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const adminForm = document.getElementById('adminForm');
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
// Meme raisonnement : n'existe que sur index.html.
document.getElementById('refreshPods')?.addEventListener('click', () => {
  populateInfraData();
});

// ---- Infobulles du diagramme d'architecture ----
// Le role de chaque brique DANS CETTE architecture precise, pas une
// description marketing generique (ex. Prometheus : "c'est ce que /api/infra
// interroge en PromQL pour les chiffres CPU/RAM/disk affiches plus bas").
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

// ---- Init ----
typewrite();
animateTerminal();
populateInfraData();
fetchTamagotchiStats();
setInterval(fetchTamagotchiStats, 10000);
initScrollAnimations();
initActiveNav();
initTabs();
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
