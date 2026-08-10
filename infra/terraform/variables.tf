// ---- Authentification OCI ----
// Ces valeurs vivent dans terraform.tfvars, qui est gitignore.

variable "tenancy_ocid" {
  type        = string
  description = "OCID du tenancy (sert aussi de compartiment racine)"
}

variable "user_ocid" {
  type        = string
  description = "OCID de l'utilisateur API"
}

variable "fingerprint" {
  type        = string
  description = "Empreinte de la cle API"
}

variable "private_key_path" {
  type        = string
  description = "Chemin vers la cle privee API (.pem)"
}

variable "compartment_ocid" {
  type        = string
  description = "Compartiment ou creer les ressources. Par defaut le tenancy."
  default     = ""
}

// ---- Placement ----

variable "region" {
  type    = string
  default = "eu-paris-1"
}

variable "availability_domain" {
  type        = string
  description = "AD exact, prefixe inclus. Verifier avec: oci iam availability-domain list"
  default     = "xerO:EU-PARIS-1-AD-1"
}

// ---- Dimensionnement ----
// 4 OCPU / 24 Go / 190 Go, c'est exactement l'enveloppe Always Free ARM.
// Ne pas depasser sans accepter la facturation.

variable "instance_name" {
  type    = string
  default = "k3s-argocd-server"
}

variable "instance_shape" {
  type    = string
  default = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  type    = number
  default = 4
}

variable "instance_memory_gb" {
  type    = number
  default = 24
}

variable "boot_volume_gb" {
  type        = number
  description = "Always Free plafonne a 200 Go de block storage au total"
  default     = 190
}

// ---- Reseau ----

variable "vcn_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.0.0.0/24"
}

variable "ssh_ingress_cidr" {
  type        = string
  description = "Restreindre a votre IP fixe si vous en avez une. 0.0.0.0/0 expose SSH au monde."
  default     = "0.0.0.0/0"
}

variable "ssh_public_key" {
  type        = string
  description = "Contenu de votre cle publique SSH (~/.ssh/id_ed25519.pub)"
}

// ---- Bootstrap ----

variable "repo_url" {
  type        = string
  description = "Depot contenant infra/bootstrap. Doit etre joignable sans Gitea, qui n'existe plus a ce stade."
  default     = "https://github.com/kaliouich/showroom.git"
}

variable "backup_bucket" {
  type    = string
  default = "showroom-backups"
}

variable "domain" {
  type    = string
  default = "khalilaliouich.com"
}

variable "acme_email" {
  type        = string
  description = "Adresse utilisee par Let's Encrypt pour les avis d'expiration"
}
