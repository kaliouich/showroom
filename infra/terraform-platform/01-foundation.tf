// ---------------------------------------------------------------------------
// Socle : CRD Gateway API, cert-manager, Envoy Gateway.
//
// Certains composants ne se distribuent pas en chart Helm — ArgoCD et Linkerd
// s'installent par manifeste officiel ou par leur CLI. Pour ceux-la on passe
// par null_resource plutot que par un provider tiers : c'est explicite, et une
// reprise d'incident n'a pas besoin d'un provider supplementaire a telecharger.
// ---------------------------------------------------------------------------

locals {
  kubectl = "KUBECONFIG=${var.kubeconfig} kubectl"
}

resource "null_resource" "gateway_api_crds" {
  triggers = {
    version = var.versions.gateway_api
  }

  provisioner "local-exec" {
    command = <<-EOT
      ${local.kubectl} apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/${var.versions.gateway_api}/standard-install.yaml
    EOT
  }
}

resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  version          = var.versions.cert_manager
  namespace        = "cert-manager"
  create_namespace = true
  wait             = true
  timeout          = 900

  set {
    name  = "crds.enabled"
    value = "true"
  }

  depends_on = [null_resource.gateway_api_crds]
}

resource "helm_release" "envoy_gateway" {
  name             = "eg"
  repository       = "oci://docker.io/envoyproxy"
  chart            = "gateway-helm"
  version          = "v${var.versions.envoy_gateway}"
  namespace        = "envoy-gateway-system"
  create_namespace = true
  wait             = true
  timeout          = 900

  depends_on = [null_resource.gateway_api_crds]
}

// Gateway unique, ClusterIssuer Let's Encrypt et certificat multi-domaines.
resource "null_resource" "gateway" {
  triggers = {
    manifest = filesha256("${path.module}/../bootstrap/manifests/gateway.yaml")
    domain   = var.domain
  }

  provisioner "local-exec" {
    command = <<-EOT
      sed 's/__DOMAIN__/${var.domain}/g; s/__ACME_EMAIL__/${var.acme_email}/g' \
        ${path.module}/../bootstrap/manifests/gateway.yaml | ${local.kubectl} apply -f -
    EOT
  }

  depends_on = [helm_release.cert_manager, helm_release.envoy_gateway]
}
