// ---------------------------------------------------------------------------
// Les applications de la vitrine, et les garde-fous qui les entourent.
// ---------------------------------------------------------------------------

// Valeurs de ressources par defaut, appliquees aux conteneurs qui n'en
// declarent pas. Posees tot : un LimitRange ne s'applique qu'aux pods crees
// ensuite, donc il doit exister avant les charges.
resource "null_resource" "limitranges" {
  triggers = {
    manifest = filesha256("${var.repo_root}/k8s/limitranges/limitranges.yaml")
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/k8s/limitranges/limitranges.yaml"
  }

  depends_on = [null_resource.argocd, helm_release.gitea, helm_release.kube_prometheus]
}

// Le site vitrine. L'image est construite localement dans le containerd de
// k3s : pas de registre externe, donc imagePullPolicy Never.
resource "null_resource" "showcase_website" {
  triggers = {
    dockerfile = filesha256("${var.repo_root}/website/Dockerfile")
    server     = filesha256("${var.repo_root}/website/server.js")
    index      = filesha256("${var.repo_root}/website/index.html")
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      cd ${var.repo_root}/website
      nerdctl --address /run/k3s/containerd/containerd.sock -n k8s.io build -t showcase-website:tf . \
        || docker build -t showcase-website:tf .
      ${local.kubectl} create ns showcase --dry-run=client -o yaml | ${local.kubectl} apply -f -
      ${local.kubectl} apply -f ${var.repo_root}/k8s/rbac.yaml || true
      ${local.kubectl} apply -f ${var.repo_root}/k8s/showcase-website/
      ${local.kubectl} -n showcase set image deploy/showcase-website website=showcase-website:tf
      ${local.kubectl} -n showcase rollout status deploy/showcase-website --timeout=600s
    EOT
  }

  depends_on = [null_resource.limitranges]
}

resource "null_resource" "tamagotchi" {
  triggers = {
    manifest = filesha256("${var.repo_root}/k8s/tamagotchi/tamagotchi-all.yaml")
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/k8s/tamagotchi/tamagotchi-all.yaml"
  }

  depends_on = [null_resource.limitranges]
}

resource "null_resource" "uptime_kuma" {
  triggers = {
    manifest = filesha256("${var.repo_root}/k8s/uptime-kuma/uptime-kuma-all.yaml")
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/k8s/uptime-kuma/uptime-kuma-all.yaml"
  }

  depends_on = [null_resource.limitranges]
}

resource "null_resource" "n8n" {
  triggers = {
    manifest = filesha256("${var.repo_root}/n8n.yaml")
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/n8n.yaml"
  }

  depends_on = [null_resource.limitranges]
}

// Les routes HTTP en dernier : elles referencent des Services qui doivent
// deja exister, sinon la Gateway les rejette et il faut repasser.
resource "null_resource" "httproutes" {
  triggers = {
    manifest = filesha256("${var.repo_root}/httproutes.yaml")
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/httproutes.yaml"
  }

  depends_on = [
    null_resource.showcase_website,
    null_resource.tamagotchi,
    null_resource.uptime_kuma,
    null_resource.n8n,
    helm_release.gitea,
    null_resource.argocd,
  ]
}
