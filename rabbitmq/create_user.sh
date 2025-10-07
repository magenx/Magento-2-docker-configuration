#!/bin/bash

. ../.env

doco exec -it rabbitmq rabbitmqctl add_vhost /${BRAND}
doco exec -it rabbitmq rabbitmqctl set_permissions -p /${BRAND} ${BRAND} ".*" ".*" ".*"
