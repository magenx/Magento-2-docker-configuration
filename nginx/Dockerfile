# syntax = docker/dockerfile:labs

FROM nginx:mainline-alpine

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG TIMEZONE

USER root

COPY ./templates /etc/nginx/templates

RUN <<EOF
  mkdir -p ${ROOT_PATH}
  addgroup -S -g 1001 ${PHP_USER}
  adduser -D -S -G ${PHP_USER} -h ${ROOT_PATH} -u 1001 ${PHP_USER}
  adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1000 ${BRAND}
    
  mkdir -p /var/cache/nginx /var/run
  chown -R ${BRAND} /var/cache/nginx /var/run /var/log/nginx /etc/nginx
    
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
EOF

