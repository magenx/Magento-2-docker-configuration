# syntax = docker/dockerfile:labs

ARG  DEBIAN_IMAGE
FROM ${DEBIAN_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_PACKAGES
ARG PHP_VERSION
ARG PHP_FPM_CONFIG
ARG PHP_FPM_POOL
ARG PHP_INI_PATH
ARG PHP_USER

ARG ROOT_PATH
ARG BRAND
ARG CURRENT_SYMLINK
ARG TIMEZONE

COPY config/* /tmp/

RUN <<EOF
  apt-get update
  apt-get -y install curl bash gettext lsb-release
  
  curl -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
  echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
  apt-get update
  apt-get install -y \
    php${PHP_VERSION} \
    php${PHP_VERSION}-fpm \
    $(echo "$PHP_PACKAGES" | sed "s/ / php${PHP_VERSION}-/g; s/^/php${PHP_VERSION}-/")
  
  envsubst < /tmp/zz-override.ini >  ${PHP_INI_PATH}
  envsubst < /tmp/www.conf > ${PHP_FPM_POOL}
  envsubst < /tmp/php-fpm.conf > ${PHP_FPM_CONFIG}
  
  mkdir -p ${ROOT_PATH}
  groupadd -r -g 1001 ${PHP_USER} 
  useradd -r -M -s /sbin/nologin -d ${ROOT_PATH} -g 1001 -u 1001 ${PHP_USER}
  mkdir -p /run/php && chown -R ${PHP_USER}:${PHP_USER} /run/php
  
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
  echo ${TIMEZONE} > /etc/timezone
  
  apt-get remove -y curl gettext lsb-release exim4* --purge
  apt-get clean all
  apt-get clean autoclean
  apt-get autoremove --purge -y
  rm -rf /var/lib/{apt,dpkg,cache,log}/
  rm -rf /tmp/*
EOF
