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

COPY --from=build /usr/share/opensearch /usr/share/opensearch
