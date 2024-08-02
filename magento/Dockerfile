# syntax = docker/dockerfile:labs
ARG BRAND
FROM ${BRAND}-php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG INSTALL_MAGENTO
ARG MAGENTO_GITHUB_REPO
ARG MAGENTO_GITHUB_BRANCH

ARG COMPOSER_USER
ARG COMPOSER_PASSWORD

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG MAGENTO_ROOT_PATH
ARG MAGENTO_PUB_PATH
ARG PHP_VERSION

RUN <<EOF
    apk update
    apk add --update --no-cache git
EOF

RUN <<EOF
    curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
    chmod +x /usr/local/bin/n98-magerun2
EOF

RUN <<EOF
    mkdir -p ${MAGENTO_ROOT_PATH}
    mkdir -p ${MAGENTO_ROOT_PATH}/var
    mkdir -p ${MAGENTO_ROOT_PATH}/pub/media 
    chown -R ${BRAND}:${PHP_USER} ${MAGENTO_ROOT_PATH}
    mkdir -p ${ROOT_PATH}/.config && chown -R ${BRAND} ${ROOT_PATH}/.config
    mkdir -p ${ROOT_PATH}/.cache && chown -R ${BRAND} ${ROOT_PATH}/.cache
    mkdir -p ${ROOT_PATH}/.local && chown -R ${BRAND} ${ROOT_PATH}/.local
    mkdir -p ${ROOT_PATH}/.composer && chown -R ${BRAND} ${ROOT_PATH}/.composer
    mkdir -p ${ROOT_PATH}/.npm && chown -R ${BRAND} ${ROOT_PATH}/.npm
    chmod -R 2750 ${MAGENTO_ROOT_PATH}
    chmod -R 2770 ${MAGENTO_ROOT_PATH}/var
    chmod -R 2770 ${MAGENTO_PUB_PATH}/media
EOF

USER ${BRAND}:${PHP_USER}

RUN <<EOF
    if [ "${INSTALL_MAGENTO}" = "yes" ]; then
    composer -n -q config -g http-basic.repo.magento.com ${COMPOSER_USER} ${COMPOSER_PASSWORD}
    cd ${MAGENTO_ROOT_PATH}
    git init -b ${MAGENTO_GITHUB_BRANCH}
    git remote add origin ${MAGENTO_GITHUB_REPO}
    git fetch origin
    git reset --hard origin/${MAGENTO_GITHUB_BRANCH}
    composer -n install --prefer-dist --no-dev --no-cache --no-ansi
    ## php -d memory_limit=-1 bin/magento setup:di:compile -n
    ## composer -n dump-autoload --no-dev --optimize --apcu
    ## bin/magento setup:static-content:deploy -n -f
    mv app/etc/env.php.build app/etc/env.php
    fi
EOF
      
