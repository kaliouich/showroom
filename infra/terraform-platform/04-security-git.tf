// ---------------------------------------------------------------------------
// Politiques, analyse de vulnerabilites, forge Git.
// ---------------------------------------------------------------------------

resource "helm_release" "kyverno" {
  name             = "kyverno"
  repository       = "https://kyverno.github.io/kyverno/"
  chart            = "kyverno"
  version          = var.versions.kyverno
  namespace        = "kyverno"
  create_namespace = true
  wait             = true
  timeout          = 900

  depends_on = [null_resource.gateway]
}

resource "helm_release" "trivy_operator" {
  name             = "trivy-operator"
  repository       = "https://aquasecurity.github.io/helm-charts/"
  chart            = "trivy-operator"
  version          = var.versions.trivy
  namespace        = "trivy-system"
  create_namespace = true
  wait             = true
  timeout          = 900

  depends_on = [null_resource.gateway]
}

resource "helm_release" "gitea" {
  name             = "gitea"
  repository       = "https://dl.gitea.com/charts/"
  chart            = "gitea"
  version          = var.versions.gitea
  namespace        = "gitea"
  create_namespace = true
  wait             = true
  timeout          = 1800

  set {
    name  = "gitea.config.server.ROOT_URL"
    value = "https://git.${var.domain}/"
  }

  // La persistance du cluster Valkey est le point qui a fait tomber Gitea le
  // 2026-08-10 : son etat de cluster vivait sur un emptyDir, si bien que
  // chaque recreation de pod lui faisait perdre son identite et cassait le
  // cluster. Voir k8s/RUNBOOK-valkey.md.
  set {
    name  = "valkey-cluster.persistence.enabled"
    value = "true"
  }

  set {
    name  = "valkey-cluster.persistence.size"
    value = "1Gi"
  }

  depends_on = [null_resource.gateway]
}
