#!/bin/bash

. .env

MAGENTO_UID="10${MAGENTO_UID}"
PHP_UID="10${PHP_UID}"
NGINX_UID="10${NGINX_UID}"
IMGPROXY_UID="10${IMGPROXY_UID}"

if [ ! -d "${MAGENTO_ROOT_PATH}/releases" ] || [ -z "$(ls -A ${MAGENTO_ROOT_PATH}/releases)" ]; then
  INSTALLATION_RELEASE="$(date +'%Y%m%d%H%M')"
  mkdir -p ${MAGENTO_ROOT_PATH}/{shared/{var/tmp,pub/media},releases/${INSTALLATION_RELEASE},public}
  cd ${MAGENTO_ROOT_PATH}/public/
  ln -snf ../releases/${INSTALLATION_RELEASE} current
  chown -h ${MAGENTO_UID}:${PHP_UID} current
fi

chown -R ${MAGENTO_UID}:${PHP_UID} ${MAGENTO_ROOT_PATH}

find ${MAGENTO_ROOT_PATH}/shared -type d ! -perm 2770 -exec chmod 2770 {} \;
find ${MAGENTO_ROOT_PATH}/shared -type f ! -perm 660 -exec chmod 660 {} \;

find ${MAGENTO_ROOT_PATH}/public ${MAGENTO_ROOT_PATH}/releases -type d ! -perm 2750 -exec chmod 2750 {} \;
find ${MAGENTO_ROOT_PATH}/public ${MAGENTO_ROOT_PATH}/releases -type f ! -perm 640 -exec chmod 640 {} \;

setfacl -R -m u:${NGINX_UID}:r-X,d:u:${NGINX_UID}:r-X ${MAGENTO_ROOT_PATH}/{releases,public,shared}
setfacl -R -m u:${IMGPROXY_UID}:r-X,d:u:${IMGPROXY_UID}:r-X ${MAGENTO_ROOT_PATH}/shared/pub/media
