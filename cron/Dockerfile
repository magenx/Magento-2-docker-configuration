# syntax = docker/dockerfile:labs

ARG ALPINE_IMAGE
FROM ${ALPINE_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_PACKAGES
ARG PHP_VERSION
ARG PHP_INI
ARG PHP_USER
ARG ROOT_PATH
ARG TIMEZONE

RUN <<EOF
  apk update
  apk add --update --no-cache \
  bash \
  gettext-envsubst
EOF

COPY config/zz-override.ini /tmp/
SHELL ["/bin/bash","-c"]

RUN <<EOF
  _PHP_PACKAGES+=(${PHP_PACKAGES})
  apk add --update --no-cache php${PHP_VERSION} ${_PHP_PACKAGES[@]/#/php${PHP_VERSION}-}
  
  envsubst < /tmp/zz-override.ini >  ${PHP_INI}/zz-override.ini
  
  mkdir -p ${ROOT_PATH}
  addgroup -S -g 1001 ${PHP_USER}
  adduser -D -S -G ${PHP_USER} -h ${ROOT_PATH} -u 1001 ${PHP_USER}
  chown -R ${PHP_USER} /var/log/php${PHP_VERSION}
  
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
  echo ${TIMEZONE} > /etc/timezone
  ln -s /usr/bin/php${PHP_VERSION} /usr/local/bin/php
  
  rm -rf /tmp/*

  echo "* * * * * umask 007; ${ROOT_PATH}/public/bin/magento cron:run 2>&1 | \
  grep -v 'Ran jobs by schedule' >> ${ROOT_PATH}/public/var/log/magento.cron.log 2>&1" > /etc/crontabs/${PHP_USER}
EOF
