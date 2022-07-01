#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

for service in portainer rabbitmq mariadb elasticsearch
do
head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?-' | fold -w 32 | head -n 1 > ${service}/${service}_password
done

echo "user default on >$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?-' | fold -w 32 | head -n 1) ~* &* +@all" > redis/redis_password

echo "REDIS_PASSWORD=\"$(grep -Po '(?<=>).*(?= ~)' redis/redis_password)\"" > env.php.env
echo "MARIADB_PASSWORD=\"$(cat mariadb/mariadb_password)\"" >> env.php.env
echo "RABBITMQ_PASSWORD=\"$(cat rabbitmq/rabbitmq_password)\"" >> env.php.env
echo "ELASTICSEARCH_PASSWORD=\"$(cat elasticsearch/elasticsearch_password)\"" >> env.php.env
