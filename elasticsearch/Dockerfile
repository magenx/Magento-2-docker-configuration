# syntax = docker/dockerfile:labs
ARG ELASTICSEARCH_VERSION
FROM elasticsearch:${ELASTICSEARCH_VERSION}

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

RUN <<EOF
/usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
/usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-phonetic
EOF
