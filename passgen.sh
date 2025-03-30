#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

sed -i '0,/## generated passwords for services/!d' .env

for SERVICE in PORTAINER REDIS RABBITMQ MARIADB OPENSEARCH INDEXER
do
PASSWORD=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?-' | fold -w 32 | head -n 1)
 if [[ "${SERVICE}" = "PORTAINER" ]]; then
   echo "${SERVICE}_PASSWORD_CLEAR=\"${PASSWORD}\"" >> .env
   PASSWORD=$(htpasswd -nb -B admin '${PORTAINER_PASSWORD}' | cut -d ":" -f 2)
 fi
echo "${SERVICE}_PASSWORD='${PASSWORD}'" >> .env
done
