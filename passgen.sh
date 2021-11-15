#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

for service in rabbitmq mariadb elasticsearch
do
head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?=+_[]{}()<>-' | fold -w 32 | head -n 1 > ${service}/${service}_password
done

echo "user default on >$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?=+_[]{}()<>-' | fold -w 32 | head -n 1) ~* &* +@all" > redis/redis_password
