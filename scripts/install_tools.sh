#!/bin/bash
# Install the supply chain tools used by the release and image-scan workflows:
#   syft   - generates the SBOM (SPDX) of an image
#   trivy  - scans images for known CVEs
# Versions and sha256 sums are pinned here, update them together.
# The sums are read by name ("${!sha}"), shellcheck cannot see that.
# shellcheck disable=SC2034
# Usage: bash scripts/install_tools.sh [syft] [trivy]   (default: all)
# Target directory: INSTALL_DIR (default /usr/local/bin), needs write access to it.
set -euo pipefail

SYFT_VERSION=1.55.0
SYFT_SHA256_amd64=bb65249542db5fedeeb4d3f9b018b75e7264dbfbbb10486f044581a92f90490d
SYFT_SHA256_arm64=929bd163db2d7cd2255d3bcb8967208079813d7b46b0c952f7b794d8e2c7d304

TRIVY_VERSION=0.76.1
TRIVY_SHA256_amd64=c7cbe3137fb8a48a17574bede3dd6beb16742d1e9772929940fc90082c39d9c0
TRIVY_SHA256_arm64=e174dff2a6dba5e3ae41f8d0537a6324405bd08132497340304c6b20e0f16a1f

INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

case "$(uname -m)" in
  x86_64|amd64) arch=amd64 ;;
  aarch64|arm64) arch=arm64 ;;
  *) echo "unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

tmp=$(mktemp -d)
trap 'rm -rf "${tmp}"' EXIT

# download url to file, fail unless its sha256 matches
fetch() {
  local url="$1" file="$2" sha256="$3"
  curl -fsSL --retry 3 -o "${file}" "${url}"
  echo "${sha256}  ${file}" | sha256sum -c --quiet - \
    || { echo "sha256 mismatch: ${url}" >&2; exit 1; }
}

install_syft() {
  local sha="SYFT_SHA256_${arch}"
  fetch "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_${arch}.tar.gz" \
    "${tmp}/syft.tar.gz" "${!sha}"
  tar -xzf "${tmp}/syft.tar.gz" -C "${tmp}" syft
  install -m 0755 "${tmp}/syft" "${INSTALL_DIR}/syft"
}

install_trivy() {
  local sha="TRIVY_SHA256_${arch}" asset=64bit
  [ "${arch}" = arm64 ] && asset=ARM64
  fetch "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-${asset}.tar.gz" \
    "${tmp}/trivy.tar.gz" "${!sha}"
  tar -xzf "${tmp}/trivy.tar.gz" -C "${tmp}" trivy
  install -m 0755 "${tmp}/trivy" "${INSTALL_DIR}/trivy"
}

[ "$#" -gt 0 ] || set -- syft trivy
for tool in "$@"; do
  case "${tool}" in
    syft|trivy) "install_${tool}"; echo "installed ${tool} in ${INSTALL_DIR}" ;;
    *) echo "unknown tool: ${tool}" >&2; exit 1 ;;
  esac
done
