# syntax = docker/dockerfile:labs
FROM alpine:3.13

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG TIMEZONE

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH
ARG APP_ROOT_PATH
ARG WEB_ROOT_PATH
ARG PHP_PACKAGES

RUN <<EOF
    apk update
    apk add --update --no-cache \
    syslog-ng \
    bash \
    ${PHP_PACKAGES}
EOF

RUN <<EOF
    mkdir -p ${APP_ROOT_PATH}
    addgroup -S -g 1001 ${PHP_USER}
    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER}
    chown -R ${PHP_USER} /var/log/php7
EOF

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

RUN echo "* * * * * ${APP_ROOT_PATH}/bin/magento cron:run 2>&1 | grep -v 'Ran jobs by schedule' >> ${APP_ROOT_PATH}/var/log/magento.cron.log" > /etc/crontabs/${PHP_USER}

ENTRYPOINT ["php-fpm7", "-F"]

USER ${PHP_USER}
