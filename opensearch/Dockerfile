# syntax = docker/dockerfile:labs

ARG OPENSEARCH_IMAGE
ARG OPENSEARCH_DEV_IMAGE

FROM ${OPENSEARCH_DEV_IMAGE} AS build
USER root
RUN <<EOF
/usr/share/opensearch/bin/opensearch-plugin install --batch analysis-icu
/usr/share/opensearch/bin/opensearch-plugin install --batch analysis-phonetic
EOF

FROM ${OPENSEARCH_IMAGE}

COPY --chmod=644 <<EOF /etc/passwd
opensearch:x:9200:9200:opensearch:/home/opensearch:/bin/sh
nobody:x:65534:65534:nobody:/nonexistent:/bin/sh
EOF

COPY --chmod=644 <<EOF /etc/group
opensearch:x:9200:opensearch
shadow:x:42:
nobody:x:65534:
EOF

COPY --from=build --chown=9200:9200 /usr/share/opensearch /usr/share/opensearch
