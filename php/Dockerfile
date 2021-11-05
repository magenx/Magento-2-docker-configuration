FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_FPM_POOL="/etc/php7/php-fpm.d/www.conf"
ARG PHP_INI="/etc/php7/php.ini"
ARG TIMEZONE

ARG magento

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
    php7-apcu \
    php7-bcmath \
    php7-bz2 \
    php7-calendar \
    php7-ctype \
    php7-curl \
    php7-dom \
    php7-fileinfo \
    php7-fpm \
    php7-gd \
    php7-gettext \
    php7-gmp \
    php7-iconv \
    php7-intl \
    php7-json \
    php7-mbstring \
    php7-mcrypt \
    php7-msgpack \
    php7-mysqli \
    php7-oauth \
    php7-odbc \
    php7-opcache \
    php7-openssl \
    php7-pdo \
    php7-pdo_dblib \
    php7-pdo_mysql \
    php7-pdo_odbc \
    php7-pdo_sqlite \
    php7-pear \
    php7-phar \
    php7-redis \
    php7-simplexml \
    php7-soap \
    php7-sockets \
    php7-sodium \
    php7-sqlite3 \
    php7-ssh2 \
    php7-tokenizer \
    php7-xmlreader \
    php7-xmlrpc \
    php7-xmlwriter \
    php7-xsl \
    php7-zip


RUN sed -i "s/\[www\]/\[${BRAND}\]/" ${PHP_FPM_POOL} && \
    sed -i "s/^user =.*/user = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -i "s/^group =.*/group = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -ri "s/;?listen.group =.*/listen.group = ${PHP_USER}/" ${PHP_FPM_POOL} && \
    sed -ri "s/;?listen.mode = 0660/listen.mode = 0660/" ${PHP_FPM_POOL} && \
    sed -i "s/listen = 127.0.0.1:9000/listen = php:9000/" ${PHP_FPM_POOL} && \
    sed -i '/sendmail_path/,$d' ${PHP_FPM_POOL} && \
    sed -i '/PHPSESSID/d' ${PHP_INI} && \
    sed -i "s,.*date.timezone.*,date.timezone = ${TIMEZONE}," ${PHP_INI} && \
    sed -i 's/^\(max_execution_time = \)[0-9]*/\17200/' ${PHP_INI} && \
    sed -i 's/^\(max_input_time = \)[0-9]*/\17200/' ${PHP_INI} && \
    sed -i 's/^\(memory_limit = \)[0-9]*M/\12048M/' ${PHP_INI} && \
    sed -i 's/^\(post_max_size = \)[0-9]*M/\164M/' ${PHP_INI} && \
    sed -i 's/^\(upload_max_filesize = \)[0-9]*M/\164M/' ${PHP_INI} && \
    sed -i 's/expose_php = On/expose_php = Off/' ${PHP_INI} && \
    sed -i 's/;realpath_cache_size =.*/realpath_cache_size = 4096k/' ${PHP_INI} && \
    sed -i 's/;realpath_cache_ttl =.*/realpath_cache_ttl = 86400/' ${PHP_INI} && \
    sed -i 's/short_open_tag = Off/short_open_tag = On/' ${PHP_INI} && \
    sed -i 's/;max_input_vars =.*/max_input_vars = 50000/' ${PHP_INI} && \
    sed -i 's/session.gc_maxlifetime = 1440/session.gc_maxlifetime = 28800/' ${PHP_INI} && \
    sed -i 's/mysql.allow_persistent = On/mysql.allow_persistent = Off/' ${PHP_INI} && \
    sed -i 's/mysqli.allow_persistent = On/mysqli.allow_persistent = Off/' ${PHP_INI}
    echo -e "\n\
\n\
; Custom pool settings \n\
php_flag[display_errors] = on \n\
php_admin_flag[log_errors] = on \n\
php_admin_value[error_log] = /proc/self/fd/2 \n\
php_admin_value[default_charset] = UTF-8 \n\
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

RUN if [ ! -z ${magento} ]; then \
    cd ${APP_ROOT_PATH} && \
    git clone https://github.com/magenx/Magento-2.git . && \
    echo 007 > magento_umask
    rm -rf .git && \
    find . -type d -exec chmod 2770 {} \; && \
    find . -type f -exec chmod 660 {} \; && \
    chmod +x bin/magento; fi

USER ${PHP_USER}

