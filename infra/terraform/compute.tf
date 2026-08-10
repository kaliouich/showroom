// Derniere image Ubuntu 24.04 ARM publiee par Oracle : evite de coder en dur
// un OCID d'image qui devient obsolete a chaque nouvelle version.
data "oci_core_images" "ubuntu_arm" {
  compartment_id           = local.compartment
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "k3s" {
  compartment_id      = local.compartment
  availability_domain = var.availability_domain
  display_name        = var.instance_name
  shape               = var.instance_shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_gb
  }

  create_vnic_details {
    subnet_id = oci_core_subnet.public.id
    // L'IP ephemere attribuee ici sera remplacee par l'IP reservee ci-dessous.
    assign_public_ip = true
    hostname_label   = "k3s"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {
      repo_url      = var.repo_url
      domain        = var.domain
      acme_email    = var.acme_email
      backup_bucket = var.backup_bucket
    }))
  }

  // Le boot volume survit a un remplacement de l'instance : sans ce cycle de
  // vie, un simple changement d'image detruirait les donnees.
  preserve_boot_volume = true

  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}

// ---------------------------------------------------------------------------
// IP PUBLIQUE RESERVEE
//
// C'est le point le plus important de tout ce fichier. L'instance actuelle
// tourne avec une IP EPHEMERE : si elle est detruite, l'IP est perdue et il
// faut reconfigurer les dix enregistrements DNS chez Porkbun a la main, en
// pleine reprise d'incident, en attendant la propagation.
//
// Une IP reservee survit a la destruction de l'instance. Le DNS n'a alors
// plus jamais besoin d'etre touche.
// ---------------------------------------------------------------------------

data "oci_core_private_ips" "primary" {
  subnet_id = oci_core_subnet.public.id

  filter {
    name   = "ip_address"
    values = [oci_core_instance.k3s.private_ip]
  }

  depends_on = [oci_core_instance.k3s]
}

resource "oci_core_public_ip" "reserved" {
  compartment_id = local.compartment
  display_name   = "ip-${var.instance_name}"
  lifetime       = "RESERVED"
  private_ip_id  = data.oci_core_private_ips.primary.private_ips[0].id
}
