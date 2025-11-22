#!/bin/bash

. .env

docker compose exec -it rabbitmq rabbitmqctl add_vhost /${BRAND}
docker compose exec -it rabbitmq rabbitmqctl set_permissions -p /${BRAND} ${BRAND} ".*" ".*" ".*"
