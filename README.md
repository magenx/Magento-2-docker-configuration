## Docker Configuration for Magento 2  
> Deploy secure and flexible docker infrastructure for Magento 2 in a matter of seconds.

<img src="https://user-images.githubusercontent.com/1591200/117845471-7abda280-b278-11eb-8c88-db3fa307ae40.jpeg" width="200" height="140"> <img src="https://user-images.githubusercontent.com/1591200/139601566-f4a62101-1ead-462e-a360-6397437de5cb.png" width="175" height="145"> <img src="https://user-images.githubusercontent.com/1591200/118028531-158ead80-b35b-11eb-8957-636de16ada34.png" width="250" height="155">
<img src="https://user-images.githubusercontent.com/1591200/130320410-91749ce8-5af1-4802-af25-ffb36e7ded98.png" width="100" height="115">  

<br />

# :rocket: Deploy your project:
- [x] Install Docker:
> https://docs.docker.com/
> https://docs.docker.com/engine/install/debian/
```
    curl -fsSL https://get.docker.com -o get-docker.sh
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    bash get-docker.sh
    chmod +x /usr/local/bin/docker-compose
```
- [x] Create deployment directory:  
```
  mkdir magento && cd magento
```
- [x] Clone repo:  
> 
```
  git clone https://github.com/magenx/Magento-2-docker-configuration.git .
```
> 
**[ ! ]** Check all data, adjust your settings, edit your variables  
- [x] Run to pull and build images and start containers:
> to enable [buildkit](https://docs.docker.com/develop/develop-images/build_enhancements/):  
>    ```echo '{ "features": { "buildkit": true } }' > /etc/docker/daemon.json```  
>    ```export DOCKER_BUILDKIT=1```  

```
   docker-compose build php --no-cache
   
   docker-compose build \
        --build-arg magento \
        --build-arg nginx
        
   docker-compose up -d
```
- [x] Watch syslog for errors and issues:
```
   tail -f /var/log/syslog
```

<br />

- [x] Run composer or magento command from host:
```
   docker-compose run --rm composer update
   docker-compose run --rm magento module:status --enabled
   docker-compose run --rm magento module:enable --all
```

<br />

- [x] Stop all services:
```
   docker-compose down
   
   Stopping magenx-cron          ... done
   Stopping magenx-nginx         ... done
   Stopping magenx-php           ... done
   Stopping magenx-magento       ... done
   Stopping magenx-elasticsearch ... done
   Stopping magenx-rabbitmq      ... done
   Stopping magenx-varnish       ... done
   Stopping magenx-certbot       ... done
   Stopping magenx-nodejs        ... done
   Stopping magenx-phpmyadmin    ... done
   Stopping magenx-mariadb       ... done
   Stopping magenx-redis         ... done
```
  
<br />

- [x] Source variables and issue magento installation command:  
```
    docker-compose run --rm magento setup:install --base-url=${DOMAIN} \
   --db-host=mariadb \
   --db-name=${MARIADB_NAME} \
   --db-user=${MARIADB_USER} \
   --db-password='${MARIADB_PASSWORD}' \
   --admin-firstname=${ADMIN_FIRSTNAME} \
   --admin-lastname=${ADMIN_LASTNAME} \
   --admin-email=${ADMIN_EMAIL} \
   --admin-user=${ADMIN_LOGIN} \
   --admin-password='${ADMIN_PASSWORD}' \
   --language=${LOCALE} \
   --currency=${CURRENCY} \
   --timezone=${TIMEZONE} \
   --cleanup-database \
   --cache-backend=redis \
   --cache-backend-redis-server=redis-cache \
   --cache-backend-redis-port=6380 \
   --cache-backend-redis-db=0 \
   --cache-backend-redis-compress-data=1 \
   --cache-backend-redis-compression-lib=gzip \
   --cache-backend-redis-password='${REDIS_PASSWORD}' \
   --session-save=redis \
   --session-save-redis-host=redis-session \
   --session-save-redis-port=6379 \
   --session-save-redis-log-level=3 \
   --session-save-redis-db=0 \
   --session-save-redis-compression-lib=gzip \
   --session-save-redis-password='${REDIS_PASSWORD}' \
   --use-rewrites=1 \
   --amqp-host=rabbitmq \
   --amqp-port=5672 \
   --amqp-user=magento \
   --amqp-password='${RABBITMQ_PASSWORD}' \
   --amqp-virtualhost='/' \
   --consumers-wait-for-messages=0 \
   --search-engine=elasticsearch7 \
   --elasticsearch-host=elasticsearch \
   --elasticsearch-port=9200 \
   --elasticsearch-enable-auth=1 \
   --elasticsearch-username=elastic \
   --elasticsearch-password='${ELASTIC_PASSWORD}'
```
  
<br />

# :hammer_and_wrench: Stack components in use:  
- [x] [MariaDB](https://hub.docker.com/_/mariadb) - MariaDB Server is a high performing open source relational database, forked from MySQL.
- [x] [Nginx](https://hub.docker.com/_/nginx) - Official build of Nginx.
- [x] [PHP](https://hub.docker.com/_/php) - PHP scripting language.
- [x] [Varnish](https://hub.docker.com/_/varnish) - Varnish is an HTTP accelerator designed for content-heavy dynamic web sites as well as APIs.
- [x] [ElasticSearch](https://hub.docker.com/_/elasticsearch) - Elasticsearch is a powerful open source search and analytics engine that makes data easy to explore.
- [x] [Redis x2](https://hub.docker.com/_/redis) - Redis is an open source key-value store that functions as a data structure server.
- [x] [RabbitMQ](https://hub.docker.com/_/rabbitmq) - RabbitMQ is an open source multi-protocol messaging broker.
- [x] [NodeJS](https://hub.docker.com/_/node) - Node.js is a JavaScript-based platform for server-side and networking applications.
- [x] [PHPMyAdmin](https://hub.docker.com/_/phpmyadmin) - phpMyAdmin - A web interface for MySQL and MariaDB.
- [x] [Certbot](https://hub.docker.com/r/certbot/certbot) - Official build of EFF's Certbot tool for obtaining TLS/SSL certificates from Let's Encrypt.
- [x] [Composer 2]
- [x] [Cron]
  
<br />
  
