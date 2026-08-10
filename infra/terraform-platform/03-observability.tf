// ---------------------------------------------------------------------------
// Observabilite : metriques, dashboards, logs.
// ---------------------------------------------------------------------------

resource "helm_release" "kube_prometheus" {
  name             = "kube-prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  version          = var.versions.kube_prom
  namespace        = "monitoring"
  create_namespace = true
  wait             = true
  timeout          = 1800

  set {
    name  = "grafana.enabled"
    value = "true"
  }

  set_sensitive {
    name  = "grafana.adminPassword"
    value = var.grafana_admin_password
  }

  // Les dashboards du site sont embarques en iframe sans authentification :
  // c'est ce qui permet a un visiteur de voir les metriques en direct.
  set {
    name  = "grafana.grafana\\.ini.auth\\.anonymous.enabled"
    value = "true"
  }

  set {
    name  = "grafana.grafana\\.ini.security.allow_embedding"
    value = "true"
  }

  set {
    name  = "prometheus.prometheusSpec.retention"
    value = "15d"
  }

  depends_on = [null_resource.gateway]
}

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  version    = var.versions.loki
  namespace  = "monitoring"
  wait       = true
  timeout    = 900

  // Grafana vient deja de kube-prometheus-stack : en installer un second
  // doublerait la consommation memoire sur un noeud qui n'a que 24 Go.
  set {
    name  = "grafana.enabled"
    value = "false"
  }

  set {
    name  = "promtail.enabled"
    value = "true"
  }

  depends_on = [helm_release.kube_prometheus]
}

// Dashboards versionnes dans le depot : logs Loki et metriques Tamagotchi.
resource "null_resource" "dashboards" {
  triggers = {
    loki       = fileexists("${var.repo_root}/k8s/monitoring/loki-dashboard-cm.yaml") ? filesha256("${var.repo_root}/k8s/monitoring/loki-dashboard-cm.yaml") : "absent"
    tamagotchi = fileexists("${var.repo_root}/k8s/tamagotchi/tamagotchi-dashboard.yaml") ? filesha256("${var.repo_root}/k8s/tamagotchi/tamagotchi-dashboard.yaml") : "absent"
  }

  provisioner "local-exec" {
    command = <<-EOT
      ${local.kubectl} apply -f ${var.repo_root}/k8s/monitoring/loki-dashboard-cm.yaml || true
      ${local.kubectl} apply -f ${var.repo_root}/k8s/tamagotchi/tamagotchi-dashboard.yaml || true
    EOT
  }

  depends_on = [helm_release.loki]
}
