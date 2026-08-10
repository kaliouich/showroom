variable "kubeconfig" {
  type    = string
  default = "/etc/rancher/k3s/k3s.yaml"
}

variable "repo_root" {
  type        = string
  description = "Racine du depot clone, d'ou sont lus les manifestes k8s/"
  default     = "/opt/showroom"
}

variable "domain" {
  type    = string
  default = "khalilaliouich.com"
}

variable "acme_email" {
  type        = string
  description = "Adresse utilisee par Let's Encrypt pour les avis d'expiration"
}

variable "grafana_admin_password" {
  type        = string
  sensitive   = true
  description = "Mot de passe admin Grafana. A definir dans terraform.tfvars, jamais ici."
}

// ---------------------------------------------------------------------------
// Versions figees.
//
// Ce sont celles relevees sur le cluster de production le 2026-08-10. Les
// laisser flottantes ferait de chaque reprise d'incident une decouverte : un
// chart qui change de schema de valeurs pendant une panne coute cher.
// ---------------------------------------------------------------------------

variable "versions" {
  type = map(string)
  default = {
    gateway_api   = "v1.2.1"
    cert_manager  = "v1.20.3"
    envoy_gateway = "1.8.2"
    kube_prom     = "87.10.1"
    loki          = "2.10.3"
    kyverno       = "3.8.1"
    trivy         = "0.33.2"
    gitea         = "12.6.0"
    argocd        = "v3.4.4"      // installe par manifeste officiel
    linkerd_edge  = "edge-26.6.3" // installe par la CLI linkerd
  }
}
