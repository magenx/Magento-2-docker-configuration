#!/bin/bash
# permissions

. .env

# userns-remap offset: host UID = SUBUID_BASE + container UID
SUBUID_BASE="$(awk -F: '/^dockremap:/{print $2}' /etc/subuid)"
: "${SUBUID_BASE:?dockremap missing from /etc/subuid - is userns-remap enabled?}"

# container UID per data directory - parents MUST precede their children
for dir in \
  "mariadb:${MARIADB_UID}" \
  "opensearch:${OPENSEARCH_UID}" \
  "opensearch/logs:${OPENSEARCH_UID}" \
  "rabbitmq:${RABBITMQ_UID}" \
  "rabbitmq/log:${RABBITMQ_UID}" \
  "valkey-cache:${VALKEY_CACHE_UID}" \
  "valkey-session:${VALKEY_SESSION_UID}" \
  "nginx:${NGINX_UID}" \
  "nginx/log:${NGINX_UID}" \
  "nginx/cache:${NGINX_UID}"
do
  IFS=":" read -r directory uid <<< "$dir"
  hostuid=$(( SUBUID_BASE + uid ))
  path="${CONTAINER_DATA_PATH}/${directory}"

  mkdir -p "$path"
  chown -R "${hostuid}:${hostuid}" "$path"
  chmod 2770 "$path"
  setfacl -R -m \
    u:${hostuid}:rwX,g:${hostuid}:rwX,o::-,\
    d:u:${hostuid}:rwX,d:g:${hostuid}:rwX,d:o::- "$path"
done
