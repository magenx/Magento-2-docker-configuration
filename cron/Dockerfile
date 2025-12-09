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
ARG CURRENT_SYMLINK

ARG SUPERCRONIC
ARG SUPERCRONIC_SHA1SUM
ARG SUPERCRONIC_URL

RUN <<EOF
  apk update
  apk add --update --no-cache bash gettext-envsubst curl
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

  curl -fsSLO "${SUPERCRONIC_URL}"
  echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c -
  chmod +x "${SUPERCRONIC}"
  mv "${SUPERCRONIC}" "/usr/local/bin/supercronic"

  echo "* * * * * umask 007; ${ROOT_PATH}/${CURRENT_SYMLINK}/bin/magento cron:run 2>&1" > /etc/crontabs/${PHP_USER}
  
  rm -rf /tmp/*
EOF
