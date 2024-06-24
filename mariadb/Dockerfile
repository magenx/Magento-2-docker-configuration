ARG MARIADB_VERSION
FROM mariadb:${MARIADB_VERSION}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ADD https://raw.githubusercontent.com/magenx/Magento-mysql/master/my.cnf/my.cnf /etc/mysql/conf.d/my.cnf

RUN sed -i "s/127.0.0.1/mariadb/" /etc/mysql/conf.d/my.cnf
