#!/bin/bash
# permissions

. .env

for dir in \
  "redis-cache:106380" \
  "redis-session:106379" \
  "rabbitmq:105672" \
  "opensearch:109200" \
  "mariadb:103306" \
  "nginx:108080" \
  "varnish:106082" \
  "host:100000"
do
  IFS=":" read directory uid <<< "$dir"
  mkdir -p "${CONTAINER_DATA_PATH}/${directory}"
  chown -R "${uid}:${uid}" "${CONTAINER_DATA_PATH}/${directory}"
  chmod 2770 "${CONTAINER_DATA_PATH}/${directory}"
  setfacl -R -m u:${uid}:rwX,g:${uid}:rwX,o::-,d:u:${uid}:rwX,d:g:${uid}:rwX,d:o::- ${CONTAINER_DATA_PATH}/${directory}
done
