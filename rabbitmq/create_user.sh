#!/bin/bash

. .env
. .env.secrets
export COMPOSE_ENV_FILES=.env,.env.secrets

docker compose exec -it rabbitmq rabbitmqctl delete_user guest
docker compose exec -it rabbitmq rabbitmqctl add_vhost ${BRAND}
docker compose exec -it rabbitmq rabbitmqctl set_permissions -p ${BRAND} ${BRAND} ".*" ".*" ".*"
