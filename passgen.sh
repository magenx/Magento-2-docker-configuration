#!/bin/bash

# # ---------------------------------------------------------------------------------------------------------------------#
# Generate passwords before deployment
# # ---------------------------------------------------------------------------------------------------------------------#

sed -i '0,/## generated passwords for services/!d' .env

for SERVICE in PORTAINER REDIS RABBITMQ MARIADB OPENSEARCH
do
PASSWORD=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9@%^&?-' | fold -w 32 | head -n 1)
 if [[ "${SERVICE}" = "PORTAINER" ]]; then
   echo "${SERVICE}_PASSWORD_CLEAR=\"${PASSWORD}\"" >> .env
   PASSWORD=$(printf "admin:$(openssl passwd -6 ${PASSWORD})\n" | cut -d ":" -f 2)
 fi
echo "${SERVICE}_PASSWORD='${PASSWORD}'" >> .env
done
echo "INDEXER_PASSWORD='$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 20 | head -n 1)'" >> .env
