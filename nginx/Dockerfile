# syntax = docker/dockerfile:labs
FROM nginxinc/nginx-unprivileged:mainline-alpine-perl

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG DOMAIN
ARG ROOT_PATH
ARG ADMIN_PATH
ARG ROOT_PATH
ARG TIMEZONE

ARG PROFILER_PLACEHOLDER
ARG PHPMYADMIN_FOLDER

USER root

RUN <<EOF
    apk add --no-cache curl openssl
	
    mkdir -p ${ROOT_PATH}
    addgroup -S -g 1000 ${PHP_USER}
    adduser -D -S -G ${PHP_USER} -h ${ROOT_PATH} -u 1000 ${PHP_USER}
    adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1001 ${BRAND}
    
    mkdir -p /var/cache/nginx /var/run
    chown -R ${BRAND} /var/cache/nginx /var/run /var/log/nginx
    
	ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
EOF
