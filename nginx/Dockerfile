# syntax = docker/dockerfile:labs

ARG NGINX_IMAGE
FROM ${NGINX_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG DOMAIN
ARG PHP_USER
ARG PHP_FPM
ARG TIMEZONE
ARG PROFILER
ARG RESOLVER
ARG ROOT_PATH
ARG ADMIN_PATH
ARG PHPMYADMIN_PATH
ARG RABBITMQ_PATH

USER root

COPY ./templates /tmp/templates

RUN <<EOF
  mkdir -p ${ROOT_PATH}
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

  find /tmp/templates -name "*.template" -type f | while read template; do
    relative_path="${template#/tmp/templates/}";
    target_file="/etc/nginx/${relative_path%.template}";
    target_dir=$(dirname "$target_file");
    mkdir -p "$target_dir";
    envsubst '${BRAND} ${DOMAIN} ${PHP_USER} ${PHP_FPM} ${TIMEZONE} ${PROFILER} ${RESOLVER} ${ROOT_PATH} ${ADMIN_PATH} ${PHPMYADMIN_PATH} ${RABBITMQ_PATH}' \
    < "$template" > "$target_file";
    echo "Processed: $template -> $target_file";
  done
  
  ln -snf /etc/nginx/sites-available/magento2.conf /etc/nginx/sites-enabled/magento2.conf
  ln -snf /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf
  
  rm -rf /tmp/templates

  sed -i 's,\(/var\)\{0\,1\}/run/nginx.pid,/tmp/nginx.pid,' /etc/nginx/nginx.conf
  sed -i '0,/user/{/user/d;}' /etc/nginx/nginx.conf
EOF

