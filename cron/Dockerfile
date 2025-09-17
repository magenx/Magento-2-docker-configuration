# syntax = docker/dockerfile:labs
ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG PHP_PACKAGES="apcu bcmath bz2 calendar ctype curl dom fileinfo fpm gd gettext gmp iconv \
intl json mbstring mysqli odbc opcache openssl pdo pdo_dblib pdo_mysql pdo_odbc pdo_sqlite pear \
phar redis simplexml soap sockets sodium sqlite3 tokenizer xmlreader xmlwriter xsl zip pecl-lzf pecl-ssh2 pecl-msgpack pecl-xdebug sysvmsg sysvsem sysvshm"

ARG PHP_VERSION

ARG PHP_FPM_POOL="/etc/php${PHP_VERSION}/php-fpm.d/www.conf"
ARG PHP_INI_OVERRIDES="/etc/php${PHP_VERSION}/conf.d"

ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH

RUN <<EOF
    apk update
    apk add --update --no-cache \
    bash \
    curl
EOF

SHELL ["/bin/bash","-c"]

RUN <<EOF
    _PHP_PACKAGES+=(${PHP_PACKAGES})
    apk add --update --no-cache php${PHP_VERSION} ${_PHP_PACKAGES[@]/#/php${PHP_VERSION}-}
EOF

RUN <<EOF cat > ${PHP_INI_OVERRIDES}/zz-${BRAND}-overridex.ini
opcache.enable_cli = 1
opcache.memory_consumption = 512
opcache.interned_strings_buffer = 4
opcache.max_accelerated_files = 60000
opcache.max_wasted_percentage = 5
opcache.use_cwd = 1
opcache.validate_timestamps = 0
;opcache.revalidate_freq = 2
;opcache.validate_permission= 1
opcache.validate_root= 1
opcache.file_update_protection = 2
opcache.revalidate_path = 0
opcache.save_comments = 1
opcache.load_comments = 1
opcache.fast_shutdown = 1
opcache.enable_file_override = 0
opcache.optimization_level = 0xffffffff
opcache.inherited_hack = 1
opcache.blacklist_filename=/var/log/php${PHP_VERSION}/opcache-default.blacklist
opcache.max_file_size = 0
opcache.consistency_checks = 0
opcache.force_restart_timeout = 60
opcache.error_log = "/var/log/php${PHP_VERSION}/opcache.log"
opcache.log_verbosity_level = 1
opcache.preferred_memory_model = ""
opcache.protect_memory = 0
;opcache.mmap_base = ""

max_execution_time = 7200
max_input_time = 7200
memory_limit = 2048M
post_max_size = 64M
upload_max_filesize = 64M
expose_php = Off
realpath_cache_size = 4096k
realpath_cache_ttl = 86400
short_open_tag = On
max_input_vars = 50000
session.gc_maxlifetime = 28800
mysql.allow_persistent = On
mysqli.allow_persistent = On
date.timezone = "${TIMEZONE}"
EOF

RUN <<EOF cat > ${PHP_FPM_POOL}
[${BRAND}]
user = ${PHP_USER}
group = ${PHP_USER}
listen = php:9000
listen.owner = ${BRAND}
listen.group = ${PHP_USER}
listen.mode = 0660
pm = ondemand
pm.max_children = 100
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
pm.max_requests = 10000
clear_env = no
;;
;; [php ini] settings
php_admin_flag[expose_php] = Off
php_admin_flag[short_open_tag] = On
php_admin_flag[display_errors] = Off
php_admin_flag[log_errors] = On
php_admin_flag[mysql.allow_persistent] = On
php_admin_flag[mysqli.allow_persistent] = On
php_admin_value[default_charset] = "UTF-8"
php_admin_value[memory_limit] = 1024M
php_admin_value[max_execution_time] = 7200
php_admin_value[max_input_time] = 7200
php_admin_value[max_input_vars] = 50000
php_admin_value[post_max_size] = 64M
php_admin_value[upload_max_filesize] = 64M
php_admin_value[realpath_cache_size] = 4096k
php_admin_value[realpath_cache_ttl] = 86400
php_admin_value[session.gc_maxlifetime] = 28800
php_admin_value[error_log] = "${ROOT_PATH}/current/var/log/php-fpm-error.log"
php_admin_value[date.timezone] = "${TIMEZONE}"
php_admin_value[upload_tmp_dir] = "${ROOT_PATH}/current/var/tmp"
php_admin_value[sys_temp_dir] = "${ROOT_PATH}/current/var/tmp"
;;
;; [opcache] settings
php_admin_flag[opcache.enable] = On
php_admin_flag[opcache.use_cwd] = On
php_admin_flag[opcache.validate_root] = On
php_admin_flag[opcache.revalidate_path] = Off
php_admin_flag[opcache.validate_timestamps] = Off
php_admin_flag[opcache.save_comments] = On
php_admin_flag[opcache.load_comments] = On
php_admin_flag[opcache.fast_shutdown] = On
php_admin_flag[opcache.enable_file_override] = Off
php_admin_flag[opcache.inherited_hack] = On
php_admin_flag[opcache.consistency_checks] = Off
php_admin_flag[opcache.protect_memory] = Off
php_admin_value[opcache.memory_consumption] = 512
php_admin_value[opcache.interned_strings_buffer] = 4
php_admin_value[opcache.max_accelerated_files] = 60000
php_admin_value[opcache.max_wasted_percentage] = 5
php_admin_value[opcache.file_update_protection] = 2
php_admin_value[opcache.optimization_level] = 0xffffffff
php_admin_value[opcache.blacklist_filename] = "/etc/opcache-default.blacklist"
php_admin_value[opcache.max_file_size] = 0
php_admin_value[opcache.force_restart_timeout] = 60
php_admin_value[opcache.error_log] = "/var/log/php${PHP_VERSION}/opcache.log"
php_admin_value[opcache.log_verbosity_level] = 1
php_admin_value[opcache.preferred_memory_model] = ""
EOF

RUN <<EOF
    mkdir -p ${ROOT_PATH}
    addgroup -S -g 1000 ${PHP_USER}
    adduser -D -S -G ${PHP_USER} -h ${ROOT_PATH} -u 1000 ${PHP_USER}
    adduser -D -G ${PHP_USER} -h ${ROOT_PATH} -s /bin/bash -u 1001 ${BRAND}
    chown -R ${PHP_USER} /var/log/php${PHP_VERSION}
EOF

RUN <<EOF
    ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
    echo ${TIMEZONE} > /etc/timezone
    ln -s /usr/bin/php${PHP_VERSION} /usr/local/bin/php
EOF

RUN echo "* * * * * umask 007; ${ROOT_PATH}/current/bin/magento cron:run 2>&1 | grep -v 'Ran jobs by schedule' >> ${ROOT_PATH}/current/var/log/magento.cron.log 2>&1" > /etc/crontabs/${PHP_USER}
