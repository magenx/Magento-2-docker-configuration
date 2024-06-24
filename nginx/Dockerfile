# syntax = docker/dockerfile:labs
FROM nginx:mainline-alpine-perl

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG NGINX_GITHUB_REPO

ARG BRAND
ARG PHP_USER
ARG DOMAIN
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH
ARG TZ

RUN <<EOF
    mkdir -p ${APP_ROOT_PATH}
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    addgroup -S -g 1000 ${BRAND}
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}
EOF

RUN <<EOF
    apk add --no-cache openssl git
    cd /etc/nginx
    git init
    git remote add origin ${NGINX_GITHUB_REPO}
    git fetch origin
    git reset --hard origin/main
    sed -i "s/example.com/${DOMAIN}/g" /etc/nginx/sites-available/magento2.conf
    sed -i "s,/var/www/html,${APP_ROOT_PATH},g" /etc/nginx/conf_m2/maps.conf
    sed -i "s/PROFILER_PLACEHOLDER/$(openssl rand -hex 4)/" /etc/nginx/conf_m2/maps.conf
    sed -i "s/PHPMYADMIN_PLACEHOLDER/mysql_$(openssl rand -hex 2)/g" /etc/nginx/conf_m2/phpmyadmin.conf
    sed -i "s,user  nginx,user  ${BRAND},g" /etc/nginx/nginx.conf
    ln -s /etc/nginx/sites-available/magento2.conf /etc/nginx/sites-enabled/magento2.conf
    ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf
    openssl dhparam -dsaparam -out /etc/ssl/certs/dhparams.pem 4096
    openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout /etc/ssl/certs/default_server.key -out /etc/ssl/certs/default_server.crt \
    -subj "/CN=default_server" -days 3650 -subj "/C=US/ST=Oregon/L=Portland/O=default_server/OU=Org/CN=default_server"
EOF

RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone

