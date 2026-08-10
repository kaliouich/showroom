#!/usr/bin/env bash
# Reinstalle la plateforme complete sur un k3s vierge.
#
# Les versions ci-dessous sont celles relevees sur le cluster en production le
# 2026-08-10. Elles sont figees volontairement : une reprise d'incident n'est
# pas le moment pour decouvrir qu'un chart a change de schema de valeurs.
#
# Idempotent : chaque etape utilise "helm upgrade --install" ou "kubectl apply".
set -euo pipefail

export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
source /etc/showroom.env 2>/dev/null || true
DOMAIN="${DOMAIN:-khalilaliouich.com}"
ACME_EMAIL="${ACME_EMAIL:?renseigner ACME_EMAIL dans /etc/showroom.env}"

# Versions de charts
CERT_MANAGER=v1.20.3
ENVOY_GATEWAY=1.8.2
GITEA=12.6.0
KUBE_PROM=87.10.1
LOKI=2.10.3
KYVERNO=3.8.1
TRIVY=0.33.2
# Composants installes par manifeste
ARGOCD=v3.4.4
LINKERD_EDGE=edge-26.6.3

step() { echo; echo "=== $* ==="; }
wait_ns() { kubectl -n "$1" wait --for=condition=available --timeout=600s deploy --all 2>/dev/null || true; }

step "prerequis"
command -v helm >/dev/null || curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm repo add jetstack https://charts.jetstack.io --force-update
helm repo add gitea-charts https://dl.gitea.com/charts/ --force-update
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo add grafana https://grafana.github.io/helm-charts --force-update
helm repo add kyverno https://kyverno.github.io/kyverno/ --force-update
helm repo add aqua https://aquasecurity.github.io/helm-charts/ --force-update
helm repo update

step "Gateway API (CRD) — a poser avant Envoy Gateway"
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml

step "cert-manager ${CERT_MANAGER}"
helm upgrade --install cert-manager jetstack/cert-manager \
  -n cert-manager --create-namespace \
  --version "${CERT_MANAGER}" --set crds.enabled=true --wait

step "Envoy Gateway ${ENVOY_GATEWAY}"
helm upgrade --install eg oci://docker.io/envoyproxy/gateway-helm \
  -n envoy-gateway-system --create-namespace \
  --version "v${ENVOY_GATEWAY}" --wait
kubectl -n envoy-gateway-system rollout status deploy/envoy-gateway --timeout=600s

step "Gateway, ClusterIssuer et routes"
sed "s/__DOMAIN__/${DOMAIN}/g; s/__ACME_EMAIL__/${ACME_EMAIL}/g" \
  "$(dirname "$0")/manifests/gateway.yaml" | kubectl apply -f -

step "Linkerd ${LINKERD_EDGE}"
if ! kubectl get ns linkerd >/dev/null 2>&1; then
  curl -sL https://run.linkerd.io/install-edge | sh
  export PATH="$PATH:$HOME/.linkerd2/bin"
  linkerd install --crds | kubectl apply -f -
  linkerd install | kubectl apply -f -
  linkerd check --wait 5m || true
  linkerd viz install | kubectl apply -f -
fi
# ArgoCD s'appuie massivement sur gRPC en interne : le proxy Linkerd
# l'intercepte et casse les handshakes TLS. Incident deja vecu, cf. issues.html
kubectl create ns argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate ns argocd linkerd.io/inject=disabled --overwrite

step "ArgoCD ${ARGOCD}"
kubectl apply -n argocd -f "https://raw.githubusercontent.com/argoproj/argo-cd/${ARGOCD}/manifests/install.yaml"
wait_ns argocd

step "kube-prometheus-stack ${KUBE_PROM}"
helm upgrade --install kube-prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace --version "${KUBE_PROM}" \
  --set grafana.enabled=true \
  --set grafana.adminPassword=changeme \
  --set prometheus.prometheusSpec.retention=15d \
  --wait --timeout 15m

step "Loki ${LOKI}"
helm upgrade --install loki grafana/loki-stack \
  -n monitoring --version "${LOKI}" \
  --set grafana.enabled=false --set promtail.enabled=true --wait

step "Kyverno ${KYVERNO}"
helm upgrade --install kyverno kyverno/kyverno -n kyverno --create-namespace \
  --version "${KYVERNO}" --wait

step "Trivy Operator ${TRIVY}"
helm upgrade --install trivy-operator aqua/trivy-operator \
  -n trivy-system --create-namespace --version "${TRIVY}" --wait

step "Gitea ${GITEA}"
helm upgrade --install gitea gitea-charts/gitea \
  -n gitea --create-namespace --version "${GITEA}" \
  --set gitea.config.server.ROOT_URL="https://git.${DOMAIN}/" \
  --wait --timeout 15m

step "limites de ressources par namespace"
kubectl apply -f /opt/showroom/k8s/limitranges/limitranges.yaml

step "site vitrine"
cd /opt/showroom/website
nerdctl --address /run/k3s/containerd/containerd.sock -n k8s.io build -t showcase-website:v1 . \
  || docker build -t showcase-website:v1 .
kubectl create ns showcase --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f /opt/showroom/k8s/showcase-website/

echo
echo "=== plateforme installee ==="
echo "Donnees non restaurees. Enchainer avec :"
echo "  sudo /opt/showroom/infra/bootstrap/restore-from-backup.sh"
