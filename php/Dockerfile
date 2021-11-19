# syntax = docker/dockerfile:labs
ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_PACKAGES
ARG PHP_VERSION

ARG PHP_FPM_POOL="/etc/${PHP_VERSION}/php-fpm.d/www.conf"
ARG PHP_INI="/etc/${PHP_VERSION}/php.ini"

ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH

RUN <<EOF
    apk update
    apk add --update --no-cache \
    acl \
    attr \
    bash \
    curl \
    mariadb-client
EOF

SHELL ["/bin/bash","-c"]

RUN <<EOF
    _PHP_PACKAGES+=(${PHP_PACKAGES})
    apk add --update --no-cache ${PHP_VERSION} ${_PHP_PACKAGES[@]/#/${PHP_VERSION}-}
EOF

RUN <<EOF
    sed -i "s/\[www\]/\[${BRAND}\]/" ${PHP_FPM_POOL}
    sed -i "s/^user =.*/user = ${PHP_USER}/" ${PHP_FPM_POOL}
    sed -i "s/^group =.*/group = ${PHP_USER}/" ${PHP_FPM_POOL}
    sed -ri "s/;?listen.group =.*/listen.group = ${PHP_USER}/" ${PHP_FPM_POOL}
    sed -ri "s/;?listen.mode = 0660/listen.mode = 0660/" ${PHP_FPM_POOL}
    sed -i "s/listen = 127.0.0.1:9000/listen = php:9000/" ${PHP_FPM_POOL}
    sed -i '/sendmail_path/,$d' ${PHP_FPM_POOL}
    sed -i '/PHPSESSID/d' ${PHP_INI}
    sed -i "s,.*date.timezone.*,date.timezone = ${TIMEZONE}," ${PHP_INI}
    sed -i 's/^\(max_execution_time = \)[0-9]*/\17200/' ${PHP_INI}
    sed -i 's/^\(max_input_time = \)[0-9]*/\17200/' ${PHP_INI}
    sed -i 's/^\(memory_limit = \)[0-9]*M/\12048M/' ${PHP_INI}
    sed -i 's/^\(post_max_size = \)[0-9]*M/\164M/' ${PHP_INI}
    sed -i 's/^\(upload_max_filesize = \)[0-9]*M/\164M/' ${PHP_INI}
    sed -i 's/expose_php = On/expose_php = Off/' ${PHP_INI}
    sed -i 's/;realpath_cache_size =.*/realpath_cache_size = 4096k/' ${PHP_INI}
    sed -i 's/;realpath_cache_ttl =.*/realpath_cache_ttl = 86400/' ${PHP_INI}
    sed -i 's/short_open_tag = Off/short_open_tag = On/' ${PHP_INI}
    sed -i 's/;max_input_vars =.*/max_input_vars = 50000/' ${PHP_INI}
    sed -i 's/session.gc_maxlifetime = 1440/session.gc_maxlifetime = 28800/' ${PHP_INI}
    sed -i 's/mysql.allow_persistent = On/mysql.allow_persistent = Off/' ${PHP_INI}
    sed -i 's/mysqli.allow_persistent = On/mysqli.allow_persistent = Off/' ${PHP_INI}
EOF

RUN <<EOF cat >> ${PHP_FPM_POOL}
; Custom pool settings
php_flag[display_errors] = on
php_admin_flag[log_errors] = on
php_admin_value[error_log] = /proc/self/fd/2
php_admin_value[default_charset] = UTF-8
php_admin_value[memory_limit] = 2G
php_admin_value[date.timezone] = ${TIMEZONE}
EOF

RUN <<EOF
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    addgroup -S -g 1000 ${BRAND}
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}
    chown -R ${PHP_USER} /var/log/${PHP_VERSION}
EOF

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone
