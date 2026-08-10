output "urls" {
  description = "Les points d'entree publics une fois le DNS propage."
  value = {
    site       = "https://${var.domain}"
    gitea      = "https://git.${var.domain}"
    argocd     = "https://argocd.${var.domain}"
    grafana    = "https://grafana.${var.domain}"
    prometheus = "https://prometheus.${var.domain}"
    demo       = "https://demo.${var.domain}"
    status     = "https://status.${var.domain}"
    n8n        = "https://n8n.${var.domain}"
    linkerd    = "https://linkerd.${var.domain}"
  }
}

output "mot_de_passe_argocd_initial" {
  description = "Comment recuperer le mot de passe admin genere par ArgoCD."
  value       = "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
}

output "verification" {
  value = <<-EOT

    kubectl get pods -A | grep -v Running
    kubectl get certificate -A          # doit finir a True
    kubectl get httproute -A

    Restaurer les donnees (depots Gitea, bases, volumes) :
      sudo /opt/showroom/infra/bootstrap/restore-from-backup.sh
  EOT
}
