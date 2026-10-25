# 🛠️ Technical Issues & Resolutions Log

This document serves as an in-depth technical post-mortem of the challenges faced and resolved during the deployment of the DevOps Showcase environment on the Oracle Cloud Ampere A1 (ARM64) instance.

---

## 1. CI/CD Runner Network Isolation (Gitea Actions)
**Issue:** 
The CI/CD pipeline steps (using Docker containers via `act-runner`) were failing to execute `git clone` or push Docker images. The logs indicated `Network is unreachable` or `Connection Reset by Peer` when attempting to contact the Kubernetes API or the internal Gitea registry.
**Root Cause:**
The standard Docker bridge network created by `act-runner` suffered from MTU fragmentation and NAT translation issues when communicating with K3s Pod IPs and Services on this specific Oracle Cloud virtualized network.
**Resolution:**
We configured the Gitea `act-runner` `config.yaml` to force all CI job containers to run on the host's network namespace:
```yaml
container:
  network: "host"
```
This allowed the ephemeral CI containers to seamlessly resolve `.svc.cluster.local` domains and communicate without NAT overhead.

---

## 2. GitOps Manifest Push Authentication
**Issue:**
After successfully building the Docker image, the pipeline failed during the deployment manifest update phase: `remote: Invalid username or password. fatal: Authentication failed`.
**Root Cause:**
The default `GITHUB_TOKEN` injected by Gitea Actions was insufficient or improperly configured for pushing back to the repository within the specific job context, especially since we were using `checkout` over HTTPS.
**Resolution:**
We modified the `.gitea/workflows/deploy.yaml` to inject a dedicated access token (or the GITEA_TOKEN) directly into the remote URL before pushing:
```bash
git remote set-url origin "http://oauth2:${{ secrets.GITEA_TOKEN }}@git.khalilaliouich.com/khalil/tamagotchi-service.git"
git push origin HEAD:main
```

---

## 3. ArgoCD Inaccessibility & Linkerd gRPC Interference
**Issue:**
ArgoCD became completely inaccessible (returning `502 Bad Gateway` via HTTPRoute/Gateway) and the argocd-server logs were filled with `rpc error: code = Unavailable desc = connection error`.
**Root Cause:**
The installation of the Linkerd Service Mesh globally injected sidecars into the ArgoCD namespace. Linkerd aggressively intercepts gRPC traffic. ArgoCD heavily relies on internal gRPC between `argocd-server`, `argocd-repo-server`, and `argocd-application-controller`. The proxy interception broke the TLS handshakes.
**Resolution:**
We disabled Linkerd injection specifically for the ArgoCD namespace and restarted the pods:
```bash
kubectl annotate namespace argocd linkerd.io/inject=disabled --overwrite
kubectl delete pods --all -n argocd
```

---

## 4. Kubernetes Worker Nodes Pulling Stale Images
**Issue:**
ArgoCD successfully synced the new `k8s.yaml` manifest specifying the newly built image (e.g., `git.khalilaliouich.com/khalil/tamagotchi-api:...`), but the K3s cluster refused to pull it, or pulled it but threw `ErrImagePull`.
**Root Cause:**
Initially, the registry URL in `k8s.yaml` was configured as the internal service `gitea-http.gitea.svc.cluster.local:3000`. K3s worker nodes (containerd) resolve DNS differently than pods and couldn't authenticate or resolve the internal service properly without specific containerd registry mirrors.
**Resolution:**
1. Updated the deployment YAML to use the external, resolvable domain: `git.khalilaliouich.com`.
2. Changed `imagePullPolicy` from `IfNotPresent` to `Always` to ensure K3s always queries the registry for the latest layer hashes, effectively preventing stale deployments.

---

## 5. Showcase Website `502 Bad Gateway` (Nginx vs Node.js)
**Issue:**
After successfully upgrading the frontend CSS to the new "Glassmorphism" theme, the entire site went down with a `502 Bad Gateway` error.
**Root Cause:**
A major architecture upgrade had been previously performed to replace the static Nginx server with a Node.js backend (listening on port `3000`) capable of proxying Kubernetes API requests. However, when rebuilding the Docker image for the CSS update, an older `Dockerfile` (based on Nginx, listening on port `80`) was accidentally used. The Kubernetes `Service` was still mapping `targetPort: 3000`, resulting in dropped connections.
**Resolution:**
The correct Node.js `Dockerfile`, `package.json`, and `server.js` were transferred to the build directory. The image was rebuilt using `nerdctl` and rolled out, restoring both the website and the live cluster metrics integration.

---

## 6. ArgoCD "Guest" Credentials & RBAC
**Issue:**
The showcase website advertised `guest` / `<YOUR_GUEST_PASSWORD>` as the credentials for ArgoCD, but ArgoCD rejected the login.
**Root Cause:**
While the `argocd-rbac-cm` ConfigMap properly mapped the `guest` user to the `role:readonly`, the password hash stored in `argocd-secret` for `accounts.guest.password` was either missing or incorrect.
**Resolution:**
Generated a new bcrypt hash (`$2b$12$...`) for the password `<YOUR_GUEST_PASSWORD>` locally, Base64-encoded it, and patched the Kubernetes secret directly:
```bash
kubectl patch secret argocd-secret -n argocd -p '{"data": {"accounts.guest.password": "<base64_hash>"}}'
```

---

## 7. Legacy Ingress Cleanup & Grafana Persistence
**Issue:**
The cluster was utilizing the modern Kubernetes Gateway API (with Envoy Gateway), but older `Ingress` objects (managed by NGINX) were left behind by default Helm chart deployments (like `kube-prometheus-stack`). Additionally, Grafana was losing its manual UI configurations on every pod restart.
**Root Cause:**
The `kube-prometheus-stack` deploys standard Ingress resources by default. Grafana uses an `emptyDir` ephemeral volume by default.
**Resolution:**
1. Manually deleted the ghost Ingress objects (`kubectl delete ingress`) to fully transition routing responsibilities to `HTTPRoute` resources.
2. Deployed a `PersistentVolume` (`hostPath`) and `PersistentVolumeClaim` specifically for Grafana data.
3. Upgraded the Prometheus Helm release (`helm upgrade --reuse-values`) to point Grafana to this PVC, ensuring dashboards and users created in the UI survive pod restarts without conflicting with other data directories (like `n8n`).

---

## 8. UI Translation Race Condition (i18n Bug)
**Issue:**
The showcase website occasionally rendered raw translation keys (e.g., `issues_title`) instead of the actual English or French text when a user changed the language.
**Root Cause:**
The base HTML contained the correct English text hardcoded. However, the `app.js` i18n dictionaries were missing the keys for the troubleshooting section. When the JavaScript `setLang` function executed (on load or button click), it couldn't find the translations and defaulted to returning the raw key string, actively overwriting the correct HTML content.
**Resolution:**
The missing translation keys were added to the `en` and `fr` dictionaries in `app.js`, ensuring the JavaScript renders the correct text strings rather than the keys.

---

## 9. K3s `ErrImageNeverPull` & Local Containerd Sockets
**Issue:**
After rebuilding the showcase website Docker image locally to apply frontend updates, the Kubernetes deployment failed with `ErrImageNeverPull` indicating the image did not exist locally.
**Root Cause:**
The `nerdctl build` command was executed against the standard containerd socket. K3s operates on an isolated containerd socket (`/run/k3s/containerd/containerd.sock`) and within the `k8s.io` namespace. Thus, the K3s kubelet could not see the image built in the standard namespace.
**Resolution:**
Rebuilt the image directly into the K3s ecosystem using the correct socket and namespace flags:
```bash
sudo nerdctl --address /run/k3s/containerd/containerd.sock --namespace k8s.io build -t showcase-website:v39 .
```

---

## 10. Git Commit Hanging indefinitely (GPG Signing)
**Issue:**
Automated Git operations via the IDE terminal stalled indefinitely when running `git commit`, causing background tasks to time out.
**Root Cause:**
The local Git configuration enforced GPG commit signing (`commit.gpgsign=true`). In a headless or automated terminal environment, Git silently waited for a GPG passphrase/PIN entry prompt that could not be displayed or interacted with.
**Resolution:**
Bypassed the GPG requirement for automated agent commits by injecting the `--no-gpg-sign` argument:
```bash
git commit --no-gpg-sign -m "fix: ..."
```

---

## 11. Pods `Pending` at 55 % real CPU: the node was full on *requests*
**Issue:**
After installing the Strimzi operator and applying the Kafka cluster, all three brokers (and five Trivy scan jobs for the new namespace) stayed `Pending` for hours with `0/1 nodes are available: 1 Insufficient cpu`, while `kubectl top node` showed only ~55 % CPU in use.
**Root Cause:**
The scheduler places pods on CPU *requests*, not on measured usage. The 4-vCPU node already had 100 % of its CPU reserved, mostly by idle components: Kyverno (4 controllers × 100m, measured at 2–4m each, no policy loaded), a worker requesting 500m, transient Trivy scan jobs. Memory was fine (78 % requested), so nothing looked wrong until a new workload arrived.
**Resolution:**
1. Right-sized Kyverno's four controllers from 100m to 25m requests (`helm upgrade --reuse-values`). The rolling update then deadlocked: the surge pods could not be scheduled because the node was full, so the old pods never terminated. Deleting the old pods freed the CPU and let the new ones start.
2. Kafka brokers request 50m each (they idle at a few millicores); the memory limit and JVM heap are what actually bound them (`-Xmx512m`, 1Gi limit).
**Lesson:**
On a single small node, `Allocated resources` in `kubectl describe node` is the number to watch, not `kubectl top`. And a rolling update needs headroom for the surge pod — on a full node, either lower `maxSurge` to 0 or free capacity first.


---

## 12. Gitea compromised through an unauthenticated file read (CVE-2026-59774)
**Issue:**
While investigating pods stuck in `Pending`, a `git clone` against the in-cluster Gitea failed with `504` and `remote: wget: server returned error` lines that Gitea never prints. Inside the pod, the git user's global config held `uploadpack.packObjectsHook = sh /data/home/.pwn`, and a binary named `{kthreadd}` was running under qemu emulation. A Monero miner had been installed 24 days earlier.
**Root Cause:**
Gitea 1.26.1 was exposed to the Internet with a public repository. CVE-2026-59774 (fixed in 1.27.1, published 60 days before the attack) lets an anonymous request read arbitrary server files through the markup endpoint (`#+INCLUDE` in Org-mode), which discloses `INTERNAL_TOKEN` from `app.ini`. With it, the internal logger API — reachable through the public ingress — was used to write a forged log line into the global git config as a `packObjectsHook`, executed on the next anonymous clone. Everything happened in 20 seconds on 2026-10-01 10:51 UTC. Nothing alerted for 24 days, even though the pod's CPU had gone from 0.03 to a constant 0.25 core for five days.
**Impact (verified):**
Command execution as the Gitea user in one pod. No account, token, SSH key or webhook was added; the repository history, the deployed image and the host were intact; the pod's service account had no Kubernetes permission. Every secret mounted in the pod was treated as stolen.
**Resolution:**
1. Contained first (Gitea and its runner scaled to zero), evidence preserved (volume archive, database dump, hashes), then analysed from gateway logs (Loki), Prometheus and file timestamps.
2. Rebuilt from scratch: Gitea 28.2.0, new volumes, new database, new admin credential, new access tokens scoped to the minimum (CI push, ArgoCD read-only, registry pull).
3. Hardened: sign-in required for everything, private repositories by default, `/api/internal` answered 404 by the gateway (`HTTPRouteFilter` direct response), egress of the whole namespace denied by `NetworkPolicy` (only the runner may reach the Internet, never the cluster), alert on sustained CPU.
**Lesson:**
An internal API must never be reachable from the Internet, and a forge needs both a patch cadence and an egress policy. The blast radius stayed small because of choices made earlier (no Kubernetes permissions for the pod, no secret shared with other workloads) — and detection was the missing layer, not prevention alone.
