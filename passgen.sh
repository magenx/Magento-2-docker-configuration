#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

sed -i '0,/## generated passwords for services/!d' .env

for SERVICE in REDIS RABBITMQ MARIADB OPENSEARCH INDEXER
do
PASSWORD=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9%&?' | fold -w 32 | head -n 1)
echo "${SERVICE}_PASSWORD='${PASSWORD}'" >> .env
done

for THIS in ADMIN RABBITMQ PHPMYADMIN
do
RANDOM_PATH=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 6 | head -n 1)
echo "${THIS}_PATH='${THIS,,}_${RANDOM_PATH}'" >> .env
done
