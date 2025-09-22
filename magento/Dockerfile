# syntax = docker/dockerfile:labs
FROM php

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

COPY entrypoint.sh /entrypoint.sh

RUN <<EOF
  curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
  chmod +x /usr/local/bin/n98-magerun2
  chmod +x /entrypoint.sh
EOF

