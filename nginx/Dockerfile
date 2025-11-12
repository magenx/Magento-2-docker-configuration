# syntax = docker/dockerfile:labs

ARG NGINX_IMAGE
FROM ${NGINX_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG ROOT_PATH
ARG TIMEZONE

USER root

COPY ./templates /etc/nginx/templates

RUN <<EOF
  mkdir -p ${ROOT_PATH}
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
EOF

