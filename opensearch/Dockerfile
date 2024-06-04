# syntax = docker/dockerfile:labs
FROM opensearch:2.14.0

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

RUN <<EOF
/usr/share/opensearch/bin/opensearch-plugin install analysis-icu
/usr/share/opensearch/bin/opensearch-plugin install analysis-phonetic
EOF
