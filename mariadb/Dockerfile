ARG MARIADB_VERSION
FROM mariadb:${MARIADB_VERSION}

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND

ADD https://raw.githubusercontent.com/magenx/Magento-mysql/master/my.cnf/my.cnf /etc/mysql/conf.d/${BRAND}.cnf
