#!/bin/bash
# Create role and user ${BRAND} in the OpenSearch security plugin, access to ${BRAND}* indices.
# The DHI runtime image has no curl: the requests go over bash /dev/tcp inside the opensearch
# container, like its health check. The request, with the admin password, is passed on stdin,
# never on a command line.
set -euo pipefail
. .env
. .env.secrets
export COMPOSE_ENV_FILES=.env,.env.secrets

AUTH=$(printf 'admin:%s' "${OPENSEARCH_ADMIN_PASSWORD}" | base64 -w0)

# runs in the container: send stdin to opensearch, print the response (HTTP/1.0 closes after it)
SEND='exec 3<>/dev/tcp/127.0.0.1/$0 || exit 1
IFS= read -r -d "" request || true
printf "%s" "${request}" >&3
while IFS= read -r line || [[ -n ${line} ]]; do printf "%s\n" "${line%$'"'"'\r'"'"'}"; done <&3'

# opensearch_put <path> <json body>: fails unless opensearch answers 2xx
opensearch_put() {
  local path=$1 body=$2 length response status
  length=$(printf '%s' "${body}" | LC_ALL=C wc -c)
  response=$(printf 'PUT %s HTTP/1.0\r\nHost: opensearch\r\nAuthorization: Basic %s\r\nContent-Type: application/json\r\nContent-Length: %s\r\n\r\n%s' \
    "${path}" "${AUTH}" "${length}" "${body}" \
    | docker compose exec -T opensearch bash -c "${SEND}" "${OPENSEARCH_PORT}")
  status=$(head -n 1 <<< "${response}" | cut -d ' ' -f 2)
  echo "PUT ${path}: ${response##*$'\n'}"
  [[ ${status} == 2* ]] || { echo "opensearch answered: $(head -n 1 <<< "${response}")" >&2; return 1; }
}

opensearch_put "/_plugins/_security/api/roles/${BRAND}" "$(cat <<EOF
{
    "cluster_permissions": [
      "cluster_composite_ops_monitor",
      "cluster:monitor/main",
      "cluster:monitor/state",
      "cluster:monitor/health",
      "cluster:monitor/shards",
      "cluster:monitor/nodes/info"
    ],
    "index_permissions": [
      {
        "index_patterns": ["${BRAND}*"],
        "fls": [],
        "masked_fields": [],
        "allowed_actions": ["*"]
      },
      {
        "index_patterns": ["*"],
        "fls": [],
        "masked_fields": [],
        "allowed_actions": [
          "indices:admin/get",
          "indices:admin/aliases/get",
          "indices:admin/settings/get",
          "indices:data/read/search",
          "indices:monitor/settings/get",
          "indices:monitor/stats"
        ]
      }
    ],
    "tenant_permissions": []
}
EOF
)"

opensearch_put "/_plugins/_security/api/internalusers/${BRAND}" "$(cat <<EOF
{
    "password": "${OPENSEARCH_PASSWORD}",
    "opendistro_security_roles": ["${BRAND}", "own_index"]
}
EOF
)"
