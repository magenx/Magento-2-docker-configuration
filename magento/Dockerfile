
FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_FPM_POOL="/etc/php7/php-fpm.d/www.conf"
ARG PHP_INI="/etc/php7/php.ini"
ARG TIMEZONE

ARG magento

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH
ARG PHP_PACKAGES

RUN apk update && \
    apk add --update --no-cache \
    acl \
    attr \
    bash \
    curl \
    git \
    mariadb-client \
    ${PHP_PACKAGES}

RUN mkdir -p ${APP_ROOT_PATH} && \
    addgroup -S -g 1001 ${PHP_USER} && \
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER} && \
    addgroup -S -g 1000 ${BRAND} && \
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND} && \
    chown -R ${BRAND}.${PHP_USER} ${APP_ROOT_PATH} && \
    mkdir -p ${ROOT_PATH}/.config && chown -R ${BRAND} ${ROOT_PATH}/.config && \
    mkdir -p ${ROOT_PATH}/.cache && chown -R ${BRAND} ${ROOT_PATH}/.cache && \
    mkdir -p ${ROOT_PATH}/.local && chown -R ${BRAND} ${ROOT_PATH}/.local && \
    mkdir -p ${ROOT_PATH}/.composer && chown -R ${BRAND} ${ROOT_PATH}/.composer && \
    mkdir -p ${ROOT_PATH}/.npm && chown -R ${BRAND} ${ROOT_PATH}/.npm && \
    chmod -R 2770 ${APP_ROOT_PATH} && \
    chown -R ${PHP_USER} /var/log/php7

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

USER ${BRAND}:${PHP_USER}

RUN if [ ! -z ${magento} ]; then \
    cd ${APP_ROOT_PATH} && \
    git clone https://github.com/magenx/Magento-2.git . && \
    echo 007 > magento_umask && \
    rm -rf .git && \
    find . -type d -exec chmod 2770 {} \; && \
    find . -type f -exec chmod 660 {} \; && \
    chmod +x bin/magento; fi

USER ${BRAND}
