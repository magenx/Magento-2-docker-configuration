# syntax = docker/dockerfile:labs
FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH
ARG PHP_PACKAGES

RUN <<EOF
    apk update
    apk add --update --no-cache \
    bash \
    curl \
    git \
    mariadb-client \
    composer \
    ${PHP_PACKAGES}
EOF

RUN <<EOF
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    addgroup -S -g 1000 ${BRAND}
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}
EOF

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

ENV COMPOSER_MEMORY_LIMIT=-1

USER ${BRAND}

ENTRYPOINT ["composer"]
