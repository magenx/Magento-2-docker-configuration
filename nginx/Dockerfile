# syntax = docker/dockerfile:labs
FROM nginx:mainline-alpine

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG PHP_FPM
ARG PHPMYADMIN_PHP_FPM
ARG DOMAIN
ARG ROOT_PATH
ARG TIMEZONE

ARG ADMIN_PATH
ARG PROFILER
ARG PHPMYADMIN_PATH
ARG RABBITMQ_PATH

USER root

RUN <<EOF
  apk add --no-cache curl openssl
	
  mkdir -p ${ROOT_PATH}
  addgroup -S -g 1001 ${PHP_USER}
  adduser -D -S -G ${PHP_USER} -h ${ROOT_PATH} -u 1001 ${PHP_USER}
  adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1000 ${BRAND}
    
  mkdir -p /var/cache/nginx /var/run
  chown -R ${BRAND} /var/cache/nginx /var/run /var/log/nginx
    
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
  
  COPY magento2/ /tmp/magento2/
  
  find /tmp/magento2 -type f -exec sh -c '\
    dest_path="/etc/nginx/$(echo "{}" | sed "s|/tmp/magento2/||")"; \
    mkdir -p "$(dirname "$dest_path")"; \
    envsubst < "{}" > "$dest_path"; \
    ' \;

  rm -rf /tmp/magento2
EOF

USER ${PHP_USER}