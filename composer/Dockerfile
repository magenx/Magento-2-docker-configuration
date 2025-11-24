# syntax = docker/dockerfile:labs

ARG BRAND
FROM ${BRAND}-php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_USER
ARG ROOT_PATH

ENV COMPOSER_MEMORY_LIMIT=-1

RUN <<EOF
  apk update
  apk add --update --no-cache composer
  adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1000 ${BRAND}
EOF
