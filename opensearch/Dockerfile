# syntax = docker/dockerfile:labs

ARG OPENSEARCH_IMAGE
FROM ${OPENSEARCH_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

USER root

RUN <<EOF
  groupmod --gid 9200 opensearch
  usermod --uid 9200 opensearch
  chown -R opensearch:opensearch /usr/share/opensearch
EOF

RUN <<EOF
  /usr/share/opensearch/bin/opensearch-plugin install analysis-icu
  /usr/share/opensearch/bin/opensearch-plugin install analysis-phonetic
EOF

USER opensearch