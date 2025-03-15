#!/bin/bash
. .env
doco exec -it opensearch curl -XPUT -u admin:${OPENSEARCH_PASSWORD} "opensearch:9200/_plugins/_security/api/roles/indexer_${BRAND}"   -H "Content-Type: application/json"   -d "$(cat <<EOF
{
    "cluster_permissions": [
      "cluster_composite_ops_monitor",
      "cluster:monitor/main",
      "cluster:monitor/state",
      "cluster:monitor/health"
    ],
    "index_permissions": [
      {
        "index_patterns": ["indexer_${BRAND}*"],
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

doco exec -it opensearch curl -XPUT admin:${OPENSEARCH_PASSWORD} -XPUT "http://opensearch:9200/_plugins/_security/api/internalusers/indexer_${BRAND}" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
    "password": "${INDEXER_PASSWORD}",
    "opendistro_security_roles": ["indexer_${BRAND}", "own_index"]
}
EOF
)"
