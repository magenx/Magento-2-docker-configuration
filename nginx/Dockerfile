# syntax = docker/dockerfile:labs
FROM nginx:mainline-alpine-perl

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG MAGENX_NGINX_GITHUB_REPO
ARG MAGENX_NGINX_GITHUB_REPO_API

ARG BRAND
ARG PHP_USER
ARG DOMAIN
ARG ROOT_PATH
ARG ADMIN_PATH
ARG MAGENTO_ROOT_PATH
ARG MAGENTO_PUB_PATH
ARG TZ

RUN <<EOF
    mkdir -p ${MAGENTO_ROOT_PATH}
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    addgroup -S -g 1000 ${BRAND}
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}
EOF

RUN <<EOF
    apk add --no-cache curl openssl
    cd /etc/nginx
    curl -sSo /etc/nginx/fastcgi_params  ${MAGENX_NGINX_GITHUB_REPO}magento2/fastcgi_params
    curl -sSo /etc/nginx/nginx.conf  ${MAGENX_NGINX_GITHUB_REPO}magento2/nginx.conf
    mkdir -p /etc/nginx/sites-enabled
    mkdir -p /etc/nginx/sites-available && cd /etc/nginx/sites-available/
    curl -sS "${MAGENX_NGINX_GITHUB_REPO_API}/sites-available" 2>&1 | awk -F'"' '/download_url/ {print $4 ; system("curl -sSO "$4)}'
    ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf
    mkdir -p /etc/nginx/conf_m2 && cd /etc/nginx/conf_m2/
    curl -sS "${MAGENX_NGINX_GITHUB_REPO_API}/conf_m2" 2>&1 | awk -F'"' '/download_url/ {print $4 ; system("curl -sSO "$4)}'


    sed -i "s/PROFILER_PLACEHOLDER/${PROFILER_PLACEHOLDER}/" /etc/nginx/conf_m2/maps.conf

    sed -i "s/PHPMYADMIN_PLACEHOLDER/mysql_${PHPMYADMIN_FOLDER}/g" /etc/nginx/conf_m2/phpmyadmin.conf
    sed -i "5i \\
           auth_basic \$authentication; \\
           auth_basic_user_file .mysql;"  /etc/nginx/conf_m2/phpmyadmin.conf
	 	   
    sed -i "s|127.0.0.1:9000|phpmyadmin:9000|"  /etc/nginx/conf_m2/phpmyadmin.conf

    cp /etc/nginx/sites-available/magento2.conf  /etc/nginx/sites-available/${DOMAIN}.conf
    ln -s /etc/nginx/sites-available/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}.conf
    sed -i "s/example.com/${DOMAIN}/g" /etc/nginx/sites-available/${DOMAIN}.conf
    sed -i "s/ADMIN_PLACEHOLDER/${ADMIN_PATH}/" /etc/nginx/conf_m2/extra_protect.conf

    sed -i "s/#resolver 8.8.8.8 8.8.4.4 valid=3600s;/resolver 127.0.0.11 valid=30s;/"  /etc/nginx/nginx.conf
    sed -i "s/example.com/${DOMAIN}/g" /etc/nginx/nginx.conf
    sed -i "s/127.0.0.1:9000/php:9000/"  /etc/nginx/conf_m2/maps.conf
    sed -i "s,/var/www/html,${MAGENTO_ROOT_PATH}," /etc/nginx/conf_m2/maps.conf
    sed -i "s/127.0.0.1/varnish/g" /etc/nginx/conf_m2/varnish_proxy.conf
    openssl dhparam -dsaparam -out /etc/ssl/certs/dhparams.pem 4096
    openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout /etc/ssl/certs/default_server.key -out /etc/ssl/certs/default_server.crt \
    -subj "/CN=default_server" -days 3650 -subj "/C=US/ST=Oregon/L=Portland/O=default_server/OU=Org/CN=default_server"
EOF

RUN ln -snf /usr/share/zoneinfo/${TZ} /etc/localtime && echo ${TZ} > /etc/timezone
