# syntax = docker/dockerfile:labs

ARG MARIADB_IMAGE
FROM ${MARIADB_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

COPY --chmod=0644 config/my.cnf /etc/mysql/conf.d/

