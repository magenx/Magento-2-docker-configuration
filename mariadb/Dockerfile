# syntax = docker/dockerfile:labs

ARG MARIADB_IMAGE
FROM ${MARIADB_IMAGE}

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

RUN <<EOF
  apt-get update
  apt-get install -y libdbd-mysql-perl libterm-readkey-perl
  apt-get clean
EOF
