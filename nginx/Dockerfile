# syntax = docker/dockerfile:labs
FROM nginx:mainline-alpine-perl

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG NGINX_GITHUB_REPO="https://github.com/magenx/Magento-2-docker-nginx-config"

ARG BRAND
ARG PHP_USER
ARG DOMAIN
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH
ARG TIMEZONE

RUN <<EOF
    mkdir -p ${APP_ROOT_PATH}
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    addgroup -S -g 1000 ${BRAND}
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}
EOF

RUN <<EOF
    apk add --no-cache openssl
    cd /etc/nginx
    git init
    git remote add origin ${NGINX_GITHUB_REPO}
    git fetch origin
    git reset --hard origin/main
    openssl dhparam -dsaparam -out /etc/ssl/certs/dhparams.pem 4096
    openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout /etc/ssl/certs/default_server.key -out /etc/ssl/certs/default_server.crt \
    -subj "/CN=default_server" -days 3650 -subj "/C=US/ST=Oregon/L=Portland/O=default_server/OU=Org/CN=default_server"
EOF

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

