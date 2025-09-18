# syntax = docker/dockerfile:labs
FROM php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ENV COMPOSER_MEMORY_LIMIT=-1

RUN <<EOF
    apk update
    apk add --update --no-cache composer
EOF
