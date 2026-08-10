locals {
  compartment = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid
}

resource "oci_core_vcn" "main" {
  compartment_id = local.compartment
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "VCN_${var.instance_name}"
  dns_label      = "vcnshowroom"
}

resource "oci_core_internet_gateway" "main" {
  compartment_id = local.compartment
  vcn_id         = oci_core_vcn.main.id
  display_name   = "igw-${var.instance_name}"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = local.compartment
  vcn_id         = oci_core_vcn.main.id
  display_name   = "rt-public"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = local.compartment
  vcn_id         = oci_core_vcn.main.id
  display_name   = "sl-public"

  // Sortie libre : le noeud doit joindre les registres d'images, Let's Encrypt
  // et OCI Object Storage pour les sauvegardes.
  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    source   = var.ssh_ingress_cidr
    protocol = "6"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "6"
    tcp_options {
      min = 443
      max = 443
    }
  }

  // ICMP type 3 code 4 : indispensable, sans lui la decouverte de MTU casse
  // et certaines connexions TLS restent bloquees sans message d'erreur.
  ingress_security_rules {
    source   = "0.0.0.0/0"
    protocol = "1"
    icmp_options {
      type = 3
      code = 4
    }
  }

  ingress_security_rules {
    source   = var.vcn_cidr
    protocol = "1"
    icmp_options {
      type = 3
    }
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = local.compartment
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = var.subnet_cidr
  display_name               = "subnet-public"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
}
