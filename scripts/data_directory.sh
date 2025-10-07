#!/bin/bash
# permissions

. .env

for dir in \
  "portainer:109443" \
  "fail2ban:101000" \
  "letsencrypt:101000" \
  "redis-cache:106380" \
  "redis-session:106379" \
  "redis-insight:105540" \
  "rabbitmq:105672" \
  "opensearch:109200" \
  "mariadb:103306" \
  "phpmyadmin:109000" \
  "nginx:101000" \
  "xhgui:108142"
do
  IFS=":" read directory uid <<< "$dir"
  mkdir -p "${DATA_PATH}/${directory}"
  chown -R "${uid}:${uid}" "${DATA_PATH}/${directory}"
  chmod 2770 "${DATA_PATH}/${directory}"
done
