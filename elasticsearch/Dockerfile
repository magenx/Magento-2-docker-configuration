# syntax = docker/dockerfile:labs
FROM elasticsearch:7.17.4

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

RUN <<EOF
/usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-icu
/usr/share/elasticsearch/bin/elasticsearch-plugin install analysis-phonetic
EOF
