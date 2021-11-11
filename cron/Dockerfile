# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}_php

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG APP_ROOT_PATH

RUN echo "* * * * * umask 007; ${APP_ROOT_PATH}/bin/magento cron:run 2>&1 | grep -v 'Ran jobs by schedule' >> ${APP_ROOT_PATH}/var/log/magento.cron.log 2>&1" > /etc/crontabs/${PHP_USER}

CMD crond -f

