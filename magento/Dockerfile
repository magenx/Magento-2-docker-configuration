# syntax = docker/dockerfile:labs

ARG  DEBIAN_IMAGE
FROM ${DEBIAN_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_PACKAGES
ARG PHP_VERSION
ARG PHP_INI_PATH
ARG PHP_USER

ARG ROOT_PATH
ARG BRAND
ARG CURRENT_SYMLINK
ARG TIMEZONE

COPY entrypoint.sh /entrypoint.sh
COPY config/zz-override.ini /tmp/

RUN <<EOF
  apt-get update
  apt-get install -y --no-install-recommends curl gettext lsb-release
  
  curl -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
  echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
  apt-get update
  apt-get install -y --no-install-recommends \
    php${PHP_VERSION} \
    $(echo "${PHP_PACKAGES}" | sed "s/ / php${PHP_VERSION}-/g; s/^/php${PHP_VERSION}-/")
  
  envsubst < /tmp/zz-override.ini >  ${PHP_INI_PATH}
  rm -rf /tmp/*
    
  mkdir -p ${ROOT_PATH}
  groupadd -r -g 1001 ${PHP_USER}
  useradd -M -s /sbin/nologin -d ${ROOT_PATH} -g 1001 -u 1000 ${BRAND}
  
  curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
  chmod +x /usr/local/bin/n98-magerun2
  
  chmod +x /entrypoint.sh
  
  apt-get remove -y curl gettext lsb-release --purge
  apt-get clean all
  apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false
  apt-get dist-clean
EOF


