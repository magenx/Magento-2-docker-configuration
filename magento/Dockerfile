# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}_php

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG magento

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH

RUN <<EOF
    apk update
    apk add --update --no-cache git
EOF

RUN <<EOF
    curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
    chmod +x /usr/local/bin/n98-magerun2
EOF

RUN <<EOF
    mkdir -p ${APP_ROOT_PATH}
    chown -R ${BRAND}.${PHP_USER} ${APP_ROOT_PATH}
    mkdir -p ${ROOT_PATH}/.config && chown -R ${BRAND} ${ROOT_PATH}/.config
    mkdir -p ${ROOT_PATH}/.cache && chown -R ${BRAND} ${ROOT_PATH}/.cache
    mkdir -p ${ROOT_PATH}/.local && chown -R ${BRAND} ${ROOT_PATH}/.local
    mkdir -p ${ROOT_PATH}/.composer && chown -R ${BRAND} ${ROOT_PATH}/.composer
    mkdir -p ${ROOT_PATH}/.npm && chown -R ${BRAND} ${ROOT_PATH}/.npm
    chmod -R 2770 ${APP_ROOT_PATH}
    chown -R ${PHP_USER} /var/log/php7
EOF

USER ${BRAND}:${PHP_USER}

RUN <<EOF
if [ ! -z ${magento} ]; then
    cd ${APP_ROOT_PATH}
    git clone https://github.com/magenx/Magento-2.git .
    echo 007 > magento_umask
    rm -rf .git
    find . -type d -exec chmod 2770 {} \;
    find . -type f -exec chmod 660 {} \;
    chmod +x bin/magento
fi
EOF

ENTRYPOINT ["n98-magerun2", "-vv"]

USER ${BRAND}
