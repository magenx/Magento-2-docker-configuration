#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

for SERVICE in REDIS RABBITMQ MARIADB ELASTICSEARCH PORTAINER KIBANA
do
PASSWORD=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?-' | fold -w 32 | head -n 1)
sed -i '/generated passwords for services/,$d' .env
echo "${SERVICE}_PASSWORD=\"${PASSWORD}\"" >> .env
done
