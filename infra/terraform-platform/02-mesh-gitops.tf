// ---------------------------------------------------------------------------
// Service mesh et GitOps.
// ---------------------------------------------------------------------------

resource "null_resource" "linkerd" {
  triggers = {
    version = var.versions.linkerd_edge
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      export PATH="$PATH:$HOME/.linkerd2/bin"
      command -v linkerd >/dev/null || curl -sL https://run.linkerd.io/install-edge | sh
      linkerd install --crds | ${local.kubectl} apply -f -
      linkerd install | ${local.kubectl} apply -f -
      linkerd check --wait 5m || true
      linkerd viz install | ${local.kubectl} apply -f -
    EOT
  }

  depends_on = [null_resource.gateway]
}

// ---------------------------------------------------------------------------
// ArgoCD.
//
// Le namespace est cree AVANT ArgoCD et porte linkerd.io/inject=disabled.
// ArgoCD fait transiter du gRPC entre son serveur, son repo-server et son
// application-controller ; le proxy Linkerd l'intercepte et casse les
// handshakes TLS, rendant ArgoCD totalement inaccessible. Incident deja
// rencontre sur ce cluster, documente sur la page "Technical Issues Resolved"
// du site. L'ordre de ces deux ressources n'est donc pas cosmetique.
// ---------------------------------------------------------------------------

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
    annotations = {
      "linkerd.io/inject" = "disabled"
    }
  }
}

resource "null_resource" "argocd" {
  triggers = {
    version = var.versions.argocd
  }

  provisioner "local-exec" {
    command = <<-EOT
      ${local.kubectl} apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/${var.versions.argocd}/manifests/install.yaml
      ${local.kubectl} -n argocd rollout status deploy/argocd-server --timeout=900s
    EOT
  }

  depends_on = [kubernetes_namespace.argocd, null_resource.linkerd]
}

// Compte invite en lecture seule, tel qu'annonce sur le site.
resource "null_resource" "argocd_rbac" {
  triggers = {
    manifest = fileexists("${var.repo_root}/k8s/rbac/visitor-rbac.yaml") ? filesha256("${var.repo_root}/k8s/rbac/visitor-rbac.yaml") : "absent"
  }

  provisioner "local-exec" {
    command = "${local.kubectl} apply -f ${var.repo_root}/k8s/rbac/visitor-rbac.yaml || true"
  }

  depends_on = [null_resource.argocd]
}
