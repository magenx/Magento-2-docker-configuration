#!/bin/bash

. .env

INSTALLATION_RELEASE="$(date +'%Y%m%d%H%M')"
mkdir -p ${APP_PATH}/{shared/{var/tmp,pub/media},releases/${INSTALLATION_RELEASE},public}
chown -R ${MAGENTO_UID}:${PHP_UID} ${APP_PATH}
chmod 2770 ${APP_PATH}/{shared,releases}

setfacl -R -m m:r-X,u:${MAGENTO_UID}:rwX,g:${PHP_UID}:r-X,o::-,d:u:${MAGENTO_UID}:rwX,d:g:${PHP_UID}:r-X,d:o::- ${APP_PATH}/releases
setfacl -R -m u:${MAGENTO_UID}:rwX,g:${PHP_UID}:rwX,o::-,d:u:${MAGENTO_UID}:rwX,d:g:${PHP_UID}:rwX,d:o::- ${APP_PATH}/shared/{var,pub/media}
setfacl -R -m u:${NGINX_UID}:r-X,d:u:${NGINX_UID}:r-X ${APP_PATH}/{shared,releases}

cd ${APP_PATH}/public
ln -snf ../releases/${INSTALLATION_RELEASE} current
chmod -h ${MAGENTO_UID}:${PHP_UID} current
