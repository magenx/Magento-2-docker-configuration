# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}-php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND

ENV COMPOSER_MEMORY_LIMIT=-1

USER ${BRAND}

ENTRYPOINT ["composer"]
