#!/bin/bash
# Install Magento

. .env

MAGENX_INSTALL_GITHUB_REPO="https://raw.githubusercontent.com/magenx/Magento-2-server-installation/master"

# Get Magento composer.json
docker compose run --rm magento composer create-project --repository-url=https://repo.magento.com/ magento/project-community-edition . --no-install

# Composer replace bloatware
sed -i '/"conflict":/ {
r magento/composer_replace
N
}' ${MAGENTO_ROOT_PATH}/${CURRENT_SYMLINK}/composer.json

# Install Magento packages
docker compose run --rm magento composer install

echo ""
read -e -p "  [?] Execute magento setup:install? [y/n][n]: " INSTALL_MAGENTO
if [ "${INSTALL_MAGENTO}" == "y" ]; then
MAGENTO_ADMIN_PASSWORD=$(head -c 500 /dev/urandom | tr -dc 'a-zA-Z0-9%&?' | fold -w 12 | head -n 1)
docker compose run --rm magento setup:install --base-url=https://\${DOMAIN}/ \
 --db-host=mariadb:3306 \
 --db-name=\${MARIADB_DATABASE} \
 --db-user=\${MARIADB_USER} \
 --db-password=\${MARIADB_PASSWORD} \
 --admin-firstname=admin \
 --admin-lastname=admin \
 --admin-email=admin@\${DOMAIN} \
 --admin-user=admin \
 --admin-password=${MAGENTO_ADMIN_PASSWORD} \
 --language=en_US \
 --currency=EUR \
 --timezone=\${TIMEZONE} \
 --cleanup-database \
 --use-rewrites=1 \
 --session-save=redis \
 --session-save-redis-host=session \
 --session-save-redis-port=6379 \
 --session-save-redis-log-level=3 \
 --session-save-redis-db=0 \
 --session-save-redis-password=\${REDIS_PASSWORD} \
 --session-save-redis-compression-lib=lz4 \
 --cache-backend=redis \
 --cache-backend-redis-server=cache \
 --cache-backend-redis-port=6380 \
 --cache-backend-redis-db=0 \
 --cache-backend-redis-password=\${REDIS_PASSWORD} \
 --cache-backend-redis-compress-data=1 \
 --cache-backend-redis-compression-lib=l4z \
 --amqp-host=rabbitmq \
 --amqp-port=5672 \
 --amqp-user=\${BRAND} \
 --amqp-password=\${RABBITMQ_PASSWORD} \
 --amqp-virtualhost=\${BRAND} \
 --consumers-wait-for-messages=0 \
 --search-engine=opensearch \
 --opensearch-host=opensearch \
 --opensearch-port=9200 \
 --opensearch-index-prefix=\${BRAND} \
 --opensearch-enable-auth=1 \
 --opensearch-username=\${BRAND} \
 --opensearch-password=\${OPENSEARCH_PASSWORD}
fi
