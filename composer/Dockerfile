FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"

ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH

RUN apk update && \
	apk add --update --no-cache \
	bash \
	curl \
	git \
	mariadb-client \
	composer \
        php7 \
	php7-apcu \
	php7-bcmath \
	php7-bz2 \
	php7-calendar \
	php7-ctype \
	php7-curl \
	php7-dom \
	php7-fileinfo \
	php7-gd \
	php7-gettext \
	php7-gmp \
	php7-iconv \
	php7-intl \
	php7-json \
	php7-mbstring \
	php7-mcrypt \
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


RUN addgroup -S -g 1001 ${PHP_USER} && \
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER} && \
    addgroup -S -g 1000 ${BRAND} && \
    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

ENV COMPOSER_MEMORY_LIMIT=-1

ENTRYPOINT ["composer"]

USER ${BRAND}

