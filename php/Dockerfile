FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"

ARG PHP_FPM_POOL="/etc/php7/php-fpm.d/www.conf"
ARG PHP_INI="/etc/php7/php.ini"
ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH

RUN apk update && \
	apk add --update --no-cache \
        acl \
        attr \
	bash \
	curl \
	git \
	mariadb-client \
	php7 \
	php7-calendar \
	php7-mcrypt \
	php7-sodium \
	php7-opcache \
	php7-apcu \
	php7-soap \
	php7-openssl \
	php7-gmp \
	php7-json \
	php7-dom \
	php7-pdo \
	php7-zip \
	php7-mysqli \
	php7-sqlite3 \
	php7-bcmath \
	php7-gd \
	php7-odbc \
	php7-pdo_odbc \
	php7-pdo_mysql \
	php7-pdo_sqlite \
	php7-pdo_dblib \
	php7-gettext \
	php7-xmlreader \
	php7-xmlwriter \
	php7-xmlrpc \
	php7-simplexml \
	php7-bz2 \
	php7-iconv \
	php7-intl \
	php7-curl \
	php7-ctype \
	php7-phar \
	php7-mbstring \
	php7-fileinfo \
	php7-xsl \
	php7-sockets \
	php7-pear \
	php7-redis \
	php7-oauth \
	php7-ssh2 \
	php7-fpm


RUN sed -i "s/\[www\]/\[${BRAND}\]/" ${PHP_FPM_POOL} && \
    sed -i "s/^user =.*/user = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -i "s/^group =.*/group = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -ri "s/;?listen.group =.*/listen.group = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -ri "s/;?listen.mode = 0660/listen.mode = 0660/" ${PHP_FPM_POOL} && \
    sed -i '/sendmail_path/,$d' ${PHP_FPM_POOL} && \
    sed -i '/PHPSESSID/d' ${PHP_INI} && \
    sed -i "s,.*date.timezone.*,date.timezone = ${TIMEZONE}," ${PHP_INI} && \
    echo -e "\n\
\n\
; Custom pool settings \n\
php_flag[display_errors] = on \n\
php_admin_flag[log_errors] = on \n\
php_admin_value[error_log] = /proc/self/fd/2 \n\
php_admin_value[default_charset] = UTF-8 \n\
php_flag[display_errors] = off \n\
php_admin_value[memory_limit] = 2G \n\
php_admin_value[date.timezone] = ${TIMEZONE} \n\
" >> ${PHP_FPM_POOL}

RUN mkdir -p ${APP_ROOT_PATH} && \
    addgroup -S -g 1001 ${PHP_USER} && \
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER} && \
    addgroup -S -g 1000 ${BRAND} && \
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND} && \
    chown -R ${BRAND}.${PHP_USER} ${APP_ROOT_PATH} && \
    chmod -R 2770 ${APP_ROOT_PATH} && \
    chown -R ${PHP_USER} /var/log/php7

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

USER ${BRAND}:${PHP_USER}

RUN cd ${APP_ROOT_PATH} && \
    git clone https://github.com/magenx/Magento-2.git . && \
    rm -rf .git && \
    find . -type d -exec chmod 2750 {} \; && \
    find . -type f -exec chmod 640 {} \; && \
    chmod +x bin/magento && \
    find var generated pub/media pub/static -type d -exec chmod 2770 {} \; && \
    find var generated pub/media pub/static -type f -exec chmod 660 {} \;

USER ${PHP_USER}
