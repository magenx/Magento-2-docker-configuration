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

ARG SUPERCRONIC
ARG SUPERCRONIC_SHA1SUM
ARG SUPERCRONIC_URL

COPY config/zz-override.ini /tmp/

RUN <<EOF
  apt-get update
  apt-get -y install curl bash gettext lsb-release
  
  curl -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
  echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list
  apt-get update
  apt-get install -y \
    php${PHP_VERSION} \
    $(echo "$PHP_PACKAGES" | sed "s/ / php${PHP_VERSION}-/g; s/^/php${PHP_VERSION}-/")
  
  envsubst < /tmp/zz-override.ini >  ${PHP_INI_PATH}
  
  mkdir -p ${ROOT_PATH}
  groupadd -r -g 1001 ${PHP_USER} 
  useradd -r -M -s /sbin/nologin -d ${ROOT_PATH} -g 1001 -u 1001 ${PHP_USER}
  
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
  echo ${TIMEZONE} > /etc/timezone

  curl -fsSLO "${SUPERCRONIC_URL}"
  echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c -
  chmod +x "${SUPERCRONIC}"
  mv "${SUPERCRONIC}" "/usr/local/bin/supercronic"

  echo "* * * * * umask 007; ${ROOT_PATH}/${CURRENT_SYMLINK}/bin/magento cron:run 2>&1" > ${ROOT_PATH}/crontab_${PHP_USER}
  
  apt-get remove -y curl gettext lsb-release exim4* --purge
  apt-get clean all
  apt-get clean autoclean
  apt-get autoremove --purge -y
  rm -rf /var/lib/{apt,dpkg,cache,log}/
  rm -rf /tmp/*
EOF
