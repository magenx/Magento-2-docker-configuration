FROM alpine:3.13
MAINTAINER Magenx Admin <admin@magenx.com>

RUN apk update && \
	apk add --update --no-cache \
	bash \
	curl \
	git \
	mariadb-client \
	composer \
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

#RUN addgroup -g 1001 www-data \
#	&& adduser -D -u 1001 -G www-data www-data

#USER www-data:www-data

VOLUME /var/www/html

WORKDIR /var/www/html
