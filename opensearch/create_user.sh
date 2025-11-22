#!/bin/bash
. .env
docker compose exec -it opensearch curl -XPUT -u admin:${OPENSEARCH_ADMIN_PASSWORD} "opensearch:9200/_plugins/_security/api/roles/${BRAND}"   -H "Content-Type: application/json"   -d "$(cat <<EOF
{
    "cluster_permissions": [
      "cluster_composite_ops_monitor",
      "cluster:monitor/main",
      "cluster:monitor/state",
      "cluster:monitor/health"
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
        "indices:admin/aliases/get",
        "indices:data/read/search",
        "indices:admin/get"]
      }
    ],
    "tenant_permissions": []
}
EOF

)"

docker compose exec -it opensearch curl -XPUT -u admin:${OPENSEARCH_ADMIN_PASSWORD} -XPUT "http://opensearch:9200/_plugins/_security/api/internalusers/${BRAND}" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
    "password": "${OPENSEARCH_PASSWORD}",
    "opendistro_security_roles": ["${BRAND}", "own_index"]
}
EOF
)"
