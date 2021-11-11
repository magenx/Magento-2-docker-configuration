# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}_php

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND

RUN <<EOF
    apk update
    apk add --update --no-cache \
    composer
EOF

ENV COMPOSER_MEMORY_LIMIT=-1

USER ${BRAND}

ENTRYPOINT ["composer"]
