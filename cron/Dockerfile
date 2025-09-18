# syntax = docker/dockerfile:labs
FROM php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_USER
ARG ROOT_PATH

RUN echo "* * * * * umask 007; ${ROOT_PATH}/public/bin/magento cron:run 2>&1 | grep -v 'Ran jobs by schedule' >> ${ROOT_PATH}/public/var/log/magento.cron.log 2>&1" > /etc/crontabs/${PHP_USER}
