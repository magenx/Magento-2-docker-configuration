#!/bin/bash

. .env

MAGENTO_UID="10${MAGENTO_UID}"
PHP_UID="10${PHP_UID}"
NGINX_UID="10${NGINX_UID}"
IMGPROXY_UID="10${IMGPROXY_UID}"

if [ ! -d "${APP_PATH}/releases" ] || [ -z "$(ls -A ${APP_PATH}/releases)" ]; then
  INSTALLATION_RELEASE="$(date +'%Y%m%d%H%M')"
  mkdir -p ${APP_PATH}/{shared/{var/tmp,pub/media},releases/${INSTALLATION_RELEASE},public}
  cd ${APP_PATH}/public/
  ln -snf ../releases/${INSTALLATION_RELEASE} current
  chown -h ${MAGENTO_UID}:${PHP_UID} current
fi

chown -R ${MAGENTO_UID}:${PHP_UID} ${APP_PATH}
chmod 2770 ${APP_PATH}/{shared,releases,public}

find ${APP_PATH} -type d ! -perm 2770 -exec chmod 2770 {} \;
find ${APP_PATH} -type f ! -perm 660 -exec chmod 660 {} \;

setfacl -R -m m:r-X,u:${MAGENTO_UID}:rwX,g:${PHP_UID}:r-X,o::-,d:u:${MAGENTO_UID}:rwX,d:g:${PHP_UID}:r-X,d:o::- ${APP_PATH}/releases
setfacl -R -m u:${MAGENTO_UID}:rwX,g:${PHP_UID}:rwX,o::-,d:u:${MAGENTO_UID}:rwX,d:g:${PHP_UID}:rwX,d:o::- ${APP_PATH}/{shared/{var,pub/media},public}
setfacl -R -m u:${NGINX_UID}:r-X,d:u:${NGINX_UID}:r-X ${APP_PATH}/{shared,releases,public}
setfacl -R -m u:${IMGPROXY_UID}:r-X,d:u:${IMGPROXY_UID}:r-X ${APP_PATH}/shared/pub/media
