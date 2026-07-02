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
git remote set-url origin "http://oauth2:${{ secrets.GITEA_TOKEN }}@git.<YOUR_VM_IP>.nip.io/khalil/tamagotchi-service.git"
git push origin HEAD:main
```

---

## 3. ArgoCD Inaccessibility & Linkerd gRPC Interference
**Issue:**
ArgoCD became completely inaccessible (returning `502 Bad Gateway` via Ingress) and the argocd-server logs were filled with `rpc error: code = Unavailable desc = connection error`.
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
ArgoCD successfully synced the new `k8s.yaml` manifest specifying the newly built image (e.g., `git.<YOUR_VM_IP>.nip.io/khalil/tamagotchi-api:...`), but the K3s cluster refused to pull it, or pulled it but threw `ErrImagePull`.
**Root Cause:**
Initially, the registry URL in `k8s.yaml` was configured as the internal service `gitea-http.gitea.svc.cluster.local:3000`. K3s worker nodes (containerd) resolve DNS differently than pods and couldn't authenticate or resolve the internal service properly without specific containerd registry mirrors.
**Resolution:**
1. Updated the deployment YAML to use the external, resolvable domain: `git.<YOUR_VM_IP>.nip.io`.
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
