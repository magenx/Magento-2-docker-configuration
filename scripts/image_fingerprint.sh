#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Print "<service> <fingerprint>" for every service built from this repo.
# The fingerprint covers everything the image is built from:
#   resolved compose build section (target, labels, secret ids, args the Dockerfile declares incl. base image digests),
#   build context content, build secret values and BUILD_EPOCH (bump it to force a full rebuild).
# Same inputs give the same fingerprint, so an image is rebuilt only when one of its inputs changes.
# Not covered: unpinned downloads during the build (apt packages, n98-magerun2 phar, dockerfile frontend).
# # ---------------------------------------------------------------------------------------------------------------------#

set -euo pipefail

set -a
# shellcheck source=/dev/null
. ./.env
# shellcheck source=/dev/null
. ./.env.secrets
set +a

config=$(docker compose -f docker-compose.yml config --format json)

for svc in $(jq -r '.services | to_entries[] | select(.value.build) | .key' <<< "${config}" | sort); do
  context=$(jq -r --arg s "${svc}" '.services[$s].build.context' <<< "${config}")
  dockerfile=$(jq -r --arg s "${svc}" '.services[$s].build.dockerfile // "Dockerfile"' <<< "${config}")
  # keep only build args the Dockerfile declares, shared arg anchors pass more than each image uses
  declared=$(grep -oP '^\s*ARG\s+\K[A-Za-z0-9_]+' "${context}/${dockerfile}" | sort -u | jq -R . | jq -s -c .)
  build=$(jq -S -c --arg s "${svc}" --argjson declared "${declared}" \
    '.services[$s].build | del(.context) | .args |= ((. // {}) | with_entries(select(.key as $k | $declared | index($k))))' <<< "${config}")
  context_hash=$(tar --sort=name --mtime=@0 --owner=0 --group=0 --numeric-owner --exclude=.git \
    -cf - -C "${context}" . | sha256sum | cut -d' ' -f1)
  secrets_hash=$(jq -r --arg s "${svc}" '.services[$s].build.secrets // [] | .[].source' <<< "${config}" \
    | while read -r id; do
        var=$(jq -r --arg id "${id}" '.secrets[$id].environment // empty' <<< "${config}")
        printf '%s=%s\n' "${id}" "${var:+${!var:-}}"
      done | sha256sum | cut -d' ' -f1)
  fingerprint=$(printf '%s\n%s\n%s\n%s\n' "${build}" "${context_hash}" "${secrets_hash}" "${BUILD_EPOCH:-0}" \
    | sha256sum | cut -c1-12)
  echo "${svc} ${fingerprint}"
done
