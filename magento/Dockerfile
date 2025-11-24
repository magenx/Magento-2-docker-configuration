# syntax = docker/dockerfile:labs

ARG BRAND
FROM ${BRAND}-php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_USER
ARG ROOT_PATH

COPY entrypoint.sh /entrypoint.sh

RUN <<EOF
  adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1000 ${BRAND}
  curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
  chmod +x /usr/local/bin/n98-magerun2
  chmod +x /entrypoint.sh
EOF

