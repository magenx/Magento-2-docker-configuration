# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}-php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG MAGENTO_ROOT_PATH

RUN echo "* * * * * umask 007; ${MAGENTO_ROOT_PATH}/bin/magento cron:run 2>&1 | grep -v 'Ran jobs by schedule' >> ${MAGENTO_ROOT_PATH}/var/log/magento.cron.log 2>&1" > /etc/crontabs/${PHP_USER}
