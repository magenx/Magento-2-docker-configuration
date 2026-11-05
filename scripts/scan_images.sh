#!/bin/bash
# Scan images for known CVEs with trivy and print a markdown report to stdout.
# Usage: bash scripts/scan_images.sh <file with "<service> <image ref>" lines>
# Run it from the repo root, exceptions are read from .trivyignore there.
# Exit code: 0 clean, 1 an image has a CRITICAL or HIGH CVE with a fixed version that .trivyignore does not list,
# 2 a scan failed. CRITICAL or HIGH CVEs without a fix are listed as a count only and do not fail.
# Only vulnerabilities are scanned, no secrets: the images carry the BUILD_SECRETS values on purpose
# and a secret scan would print them.
# Local images are read from docker, other refs straight from the registry (docker login for private ones).
set -euo pipefail

list="${1:?usage: scan_images.sh <file with service and image ref per line>}"
cache="${TRIVY_CACHE_DIR:-${RUNNER_TEMP:-/tmp}/trivy-cache}"
out=$(mktemp -d)
trap 'rm -rf "${out}"' EXIT

ignore=()
[ -f .trivyignore ] && ignore=(--ignorefile .trivyignore)

fixable_total=0
failed=()
summary=""
details=""

while read -r svc ref; do
  [ -n "${svc}" ] || continue
  if ! trivy image --cache-dir "${cache}" --quiet --skip-version-check --disable-telemetry \
      --scanners vuln --severity CRITICAL,HIGH "${ignore[@]}" \
      --format json --output "${out}/${svc}.json" "${ref}" >&2; then
    failed+=("${svc}")
    summary+="| ${svc} | scan failed | | |"$'\n'
    continue
  fi
  # one row per vulnerable package, the same CVE can hit several targets (os packages, jars, node modules)
  jq -r '[.Results[]? | .Target as $t | .Vulnerabilities[]?
          | {id: .VulnerabilityID, sev: .Severity, pkg: .PkgName, installed: .InstalledVersion,
             fixed: (.FixedVersion // ""), target: $t}] | unique_by([.id, .pkg, .installed, .target]) | .[]
          | [.id, .sev, .pkg, .installed, .fixed, .target] | @tsv' "${out}/${svc}.json" > "${out}/${svc}.tsv"
  fixed_crit=$(awk -F'\t' '$5 != "" && $2 == "CRITICAL"' "${out}/${svc}.tsv" | wc -l)
  fixed_high=$(awk -F'\t' '$5 != "" && $2 == "HIGH"' "${out}/${svc}.tsv" | wc -l)
  unfixed=$(awk -F'\t' '$5 == ""' "${out}/${svc}.tsv" | wc -l)
  fixable_total=$((fixable_total + fixed_crit + fixed_high))
  summary+="| ${svc} | ${fixed_crit} | ${fixed_high} | ${unfixed} |"$'\n'
  if [ $((fixed_crit + fixed_high)) -gt 0 ]; then
    details+=$'\n'"#### ${svc}"$'\n'"\`${ref}\`"$'\n\n'
    details+="| CVE | severity | package | installed | fixed in | target |"$'\n'
    details+="|---|---|---|---|---|---|"$'\n'
    details+=$(awk -F'\t' -v OFS=' | ' '$5 != "" {print "| " $1, $2, $3, $4, $5, $6 " |"}' "${out}/${svc}.tsv" | sort -u)
    details+=$'\n'
  fi
done < "${list}"

echo "### Image CVE scan (trivy, CRITICAL and HIGH)"
echo
echo "| image | fixable critical | fixable high | without fix |"
echo "|---|---|---|---|"
printf '%s' "${summary}"
if [ -n "${details}" ]; then
  echo
  echo "Fix by updating the package or base image, bump BUILD_EPOCH for unpinned apt packages,"
  echo "or add the CVE to .trivyignore with a reason and a review date."
  printf '%s' "${details}"
fi

if [ "${#failed[@]}" -gt 0 ]; then
  echo "scan failed: ${failed[*]}" >&2
  exit 2
fi
[ "${fixable_total}" -eq 0 ] || exit 1
