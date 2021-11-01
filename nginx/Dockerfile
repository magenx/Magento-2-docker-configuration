
FROM nginx:mainline-alpine-perl

LABEL org.opencontainers.image.authors="admin@magenx.com"

ARG GITHUB_REPO_RAW_URL="https://raw.githubusercontent.com/magenx/Magento-nginx-config/master/magento2/"
ARG GITHUB_REPO_API_URL="https://api.github.com/repos/magenx/Magento-nginx-config/contents/magento2"
ARG BRAND
ARG PHP_USER
ARG DOMAIN
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH

RUN if [ ! -d "/etc/nginx/conf_m2" ]; then \
    apk add --no-cache openssl && \
    mkdir -p ${APP_ROOT_PATH} && \
    addgroup -S -g 1001 ${PHP_USER} && \
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER} && \
    addgroup -S -g 1000 ${BRAND} && \
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND} && \
    chown -R ${BRAND}:${PHP_USER} ${ROOT_PATH} && \
    chmod -R 770 ${APP_ROOT_PATH} && \
    curl -L "${GITHUB_REPO_RAW_URL}/fastcgi_params" -o /etc/nginx/fastcgi_params && \
    curl -L "${GITHUB_REPO_RAW_URL}/nginx.conf" -o /etc/nginx/nginx.conf && \
    mkdir -p /etc/nginx/sites-enabled && \
    mkdir -p /etc/nginx/sites-available && \
    mkdir -p /etc/nginx/conf_m2 && \
    cd /etc/nginx/sites-available && \
    curl -s ${GITHUB_REPO_API_URL}/sites-available 2>&1 | awk -F'"' '/download_url/ {print $4 ; system("curl -sO "$4)}' && \
    cd /etc/nginx/conf_m2 && \
    curl -s ${GITHUB_REPO_API_URL}/conf_m2 2>&1 | awk -F'"' '/download_url/ {print $4 ; system("curl -sO "$4)}' && \
    sed -i "s/example.com/${DOMAIN}/g" /etc/nginx/sites-available/magento2.conf && \
    sed -i "s,/var/www/html,${APP_ROOT_PATH},g" /etc/nginx/conf_m2/maps.conf && \
    sed -i "s,user  nginx,user  ${BRAND},g" /etc/nginx/nginx.conf && \
    ln -s /etc/nginx/sites-available/magento2.conf /etc/nginx/sites-enabled/magento2.conf && \
    ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf && \
    PROFILER_PLACEHOLDER="$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 12 | head -n 1)" && \
    sed -i "s/PROFILER_PLACEHOLDER/$${PROFILER_PLACEHOLDER}/" /etc/nginx/conf_m2/maps.conf && \
    openssl dhparam -dsaparam -out /etc/ssl/certs/dhparams.pem 4096 && \
    openssl req -x509 -newkey rsa:4096 -sha256 -nodes -keyout /etc/ssl/certs/default_server.key -out /etc/ssl/certs/default_server.crt -subj "/CN=default_server" -days 3650 -subj "/C=US/ST=Oregon/L=Portland/O=default_server/OU=Org/CN=default_server"; fi
