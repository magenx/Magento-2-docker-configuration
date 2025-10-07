#!/bin/bash

. .env

INSTALLATION_RELEASE="$(date +'%Y%m%d%H%M')"
mkdir -p ${APP_PATH}/{shared/{var,pub/media},releases/${INSTALLATION_RELEASE},public}
cd ${APP_PATH}/public
ln -snf ../releases/${INSTALLATION_RELEASE} current
chown -R 101000:101001 ${APP_PATH}
