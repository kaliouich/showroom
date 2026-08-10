output "public_ip" {
  description = "IP reservee a pointer dans le DNS. Elle ne changera plus."
  value       = oci_core_public_ip.reserved.ip_address
}

output "private_ip" {
  value = oci_core_instance.k3s.private_ip
}

output "instance_ocid" {
  value = oci_core_instance.k3s.id
}

output "ssh" {
  value = "ssh ubuntu@${oci_core_public_ip.reserved.ip_address}"
}

output "dns_records_a_creer" {
  description = "Les enregistrements A a poser chez Porkbun, une seule fois."
  value = join("\n", [
    for h in [
      "@", "www", "git", "argocd", "grafana", "prometheus",
      "demo", "status", "n8n", "linkerd", "habits", "showcase"
    ] : format("%-12s A  %s", h, oci_core_public_ip.reserved.ip_address)
  ])
}

output "etapes_suivantes" {
  value = <<-EOT

    1. Pointer le DNS sur ${oci_core_public_ip.reserved.ip_address} (voir dns_records_a_creer)
    2. ssh ubuntu@${oci_core_public_ip.reserved.ip_address}
    3. sudo tail -f /var/log/bootstrap.log        # k3s s'installe seul
    4. sudo /opt/showroom/infra/bootstrap/install-platform.sh
    5. sudo /opt/showroom/infra/bootstrap/restore-from-backup.sh

    Details et pieges : infra/DISASTER-RECOVERY.md
  EOT
}
