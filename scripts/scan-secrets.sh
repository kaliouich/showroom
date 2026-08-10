#!/usr/bin/env bash
# Refuse tout commit contenant du materiel sensible.
#
# Installation comme garde-fou permanent :
#   ln -sf ../../scripts/scan-secrets.sh .git/hooks/pre-commit
#
# Audit complet de l'historique (plus lent) :
#   ./scripts/scan-secrets.sh --history
set -uo pipefail

RED=$'\033[31m'; GREEN=$'\033[32m'; OFF=$'\033[0m'

# visitor2026 est volontairement absent de cette liste : c'est le mot de passe
# invite affiche sur le site lui-meme, il n'a rien d'un secret.
PATTERNS='BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY
BEGIN CERTIFICATE
ghp_[A-Za-z0-9]{20,}
github_pat_[A-Za-z0-9_]{20,}
AKIA[0-9A-Z]{16}
ocid1\.(user|tenancy)\.oc1\.\.[a-z0-9]{40,}
-----BEGIN
apiVersion: v1\s+kind: Secret
--password[[:space:]]+["'"'"']?[A-Za-z0-9_@!-]{4,}
(api[_-]?key|token|passwd|secret)[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9/+_-]{16,}'

check_content() { # <libelle> <fichier>
  local hit=0
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if grep -aInE -- "$p" "$2" >/dev/null 2>&1; then
      echo "${RED}  [$1] motif: $p${OFF}"
      grep -anIE -- "$p" "$2" 2>/dev/null | head -2 | sed 's/^/      /'
      hit=1
    fi
  done <<< "$PATTERNS"
  return $hit
}

FAIL=0

if [ "${1:-}" = "--history" ]; then
  echo "Audit de l'historique complet..."
  T=$(mktemp)
  n=0
  for o in $(git rev-list --objects --all | awk '{print $1}' | sort -u); do
    [ "$(git cat-file -t "$o" 2>/dev/null)" = "blob" ] || continue
    git cat-file -p "$o" > "$T" 2>/dev/null
    head -c 4 "$T" | grep -q 'PK' && { echo "${RED}  [$o] archive binaire${OFF}"; FAIL=1; }
    check_content "$o" "$T" || FAIL=1
    n=$((n+1))
  done
  rm -f "$T"
  echo "  $n blobs inspectes"
else
  # Uniquement ce qui est sur le point d'etre commite.
  for f in $(git diff --cached --name-only --diff-filter=ACM 2>/dev/null); do
    [ -f "$f" ] || continue
    case "$f" in *.example|*scan-secrets.sh) continue;; esac
    head -c 4 "$f" | grep -q 'PK' && { echo "${RED}  [$f] archive binaire${OFF}"; FAIL=1; }
    check_content "$f" "$f" || FAIL=1
  done
fi

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "${RED}Commit refuse : du materiel sensible a ete detecte.${OFF}"
  echo "Retirer le contenu, ou --no-verify si c'est un faux positif assume."
  exit 1
fi

echo "${GREEN}Aucun secret detecte.${OFF}"
