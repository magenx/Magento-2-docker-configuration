## Docker Configuration for Magento 2  
> Deploy secure and flexible docker infrastructure for Magento 2 in a matter of seconds.

<img src="https://user-images.githubusercontent.com/1591200/117845471-7abda280-b278-11eb-8c88-db3fa307ae40.jpeg" width="200" height="140"> <img src="https://user-images.githubusercontent.com/1591200/139601566-f4a62101-1ead-462e-a360-6397437de5cb.png" width="175" height="145"> <img src="https://user-images.githubusercontent.com/1591200/118028531-158ead80-b35b-11eb-8957-636de16ada34.png" width="250" height="155">
<img src="https://user-images.githubusercontent.com/1591200/130320410-91749ce8-5af1-4802-af25-ffb36e7ded98.png" width="100" height="115">  

<br />

# :rocket: Deploy your project:
> Disclaimer: By default, the latest versions of packages are configured, above those recommended by Magento 2
- [x] Install Docker [ Debian ]:
> you can use any linux host or Docker Desktop  
> https://docs.docker.com/  
> https://docs.docker.com/engine/install/debian/

- [x] Create deployment directory:  
```
  mkdir /opt/magento && cd /opt/magento
```
- [x] Clone repo:  
> 
```
  git clone https://github.com/magenx/Magento-2-docker-configuration.git .
```
  
- [x] Use init.sh script provided to install and configure docker environment:  
```
  bash init.sh
```
### or
- [x] Manual commands:  
```
  apt-get update
  apt-get install ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
```
  
- [x] Install docker compose cli:  
```
   apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
  
- [x] Add alias or use auto completion feature:  
```
  echo "alias doco='docker compose'" >> ~/.bash_profile
  . ~/.bash_profile
```
    
- [x] To avoid copying default passwords and hacking through open ports - generate new passwords:  
> https://docs.docker.com/compose/compose-file/compose-file-v3/#secrets  
```
   bash passgen.sh
```
<br />

When mariadb is started for the first time, a new database with the specified name will be created and initialized with the provided configuration variables. Furthermore, it will execute files with extensions .sh, .sql, .sql.gz, .sql.xz and .sql.zst that are found in ./mariadb/  
**magento** container using files from this repository - https://github.com/magenx/Magento-2-docker-demo , with custom env.php
<br />
  
**[ ! ]** Check all data, adjust your settings, edit your variables  
- [x] Run to pull and build images and start containers:   
```
   doco build --no-cache php       
   doco up -d
```
- [x] Watch syslog for errors and issues:
```
   tail -f /var/log/syslog
```

<br />
 
- [x] To request TLS/SSL certificate with certbot you can run this command [--staging] to test:  
```
  doco stop nginx  
  doco run -p 80:80 --rm certbot certonly \
  --email ${ADMIN_EMAIL} --agree-tos --no-eff-email --standalone -d ${DOMAIN} --staging  
  doco start nginx  
```
> change your nginx configuration to uncomment tls/ssl  
> remove [--staging] flag to reissue live certificate  
- [x] To request TLS/SSL certificate with certbot in realtime you can run this command: 
```
  doco run --rm certbot certonly \
  --email ${ADMIN_EMAIL} --agree-tos --no-eff-email --webroot -w ${WEB_ROOT_PATH} -d ${DOMAIN}  
  doco restart nginx
```

<br />

- [x] Get random mariadb root password from log:
```
doco logs mariadb 2>&1 | grep GENERATED
magenx-mariadb   | 2021-11-16 08:48:17-05:00 [Note] [Entrypoint]: GENERATED ROOT PASSWORD: xxxxxxxx
```

<br />

- [x] Example how to run composer or magento command from host:  
> magento entrypoint is n98-magerun2 script, looks like providing more commands and options  
```
   doco run --rm composer update
   doco run --rm magento module:status --enabled
   doco run --rm magento module:disable Magento_TwoFactorAuth
```
  
<br />

- [x] Source variables and issue magento installation command for example:  
```
    doco run --rm magento setup:install --base-url=http://${DOMAIN}/ \
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
   --search-engine=opensearch \
   --opensearch-host=opensearch \
   --opensearch-port=9200 \
   --opensearch-enable-auth=1 \
   --opensearch-username=indexer_${BRAND} \
   --opensearch-password='${OPENSEARCH_PASSWORD}'
```

<br />

- [x] Stop all services:
```
   doco down
   
   Stopping magenx-cron          ... done
   Stopping magenx-nginx         ... done
   Stopping magenx-php           ... done
   Stopping magenx-magento       ... done
   Stopping magenx-opensearch    ... done
   Stopping magenx-rabbitmq      ... done
   Stopping magenx-varnish       ... done
   Stopping magenx-certbot       ... done
   Stopping magenx-nodejs        ... done
   Stopping magenx-phpmyadmin    ... done
   Stopping magenx-mariadb       ... done
   Stopping magenx-redis         ... done
```
  
<br />

# :hammer_and_wrench: Stack components in use:  
- [x] [Portainer](https://hub.docker.com/r/portainer/portainer-ce) -  Portainer provides seamless management of Docker containers
- [x] [MariaDB](https://hub.docker.com/r/mariadb) - MariaDB Server is a high performing open source relational database, forked from MySQL.
- [x] [Nginx](https://hub.docker.com/r/nginx) - Official build of Nginx.
- [x] [PHP](https://hub.docker.com/r/php) - PHP scripting language.
- [x] [Varnish](https://hub.docker.com/r/varnish) - Varnish is an HTTP accelerator designed for content-heavy dynamic web sites as well as APIs.
- [x] [OpenSearch](https://hub.docker.com/r/opensearchproject) - Opensearch is a powerful open source search and analytics engine that makes data easy to explore.
- [x] [Redis x2](https://hub.docker.com/r/redis) - Redis is an open source key-value store that functions as a data structure server.
- [x] [RabbitMQ](https://hub.docker.com/r/rabbitmq) - RabbitMQ is an open source multi-protocol messaging broker.
- [x] [NodeJS](https://hub.docker.com/r/node) - Node.js is a JavaScript-based platform for server-side and networking applications.
- [x] [PHPMyAdmin](https://hub.docker.com/r/phpmyadmin) - phpMyAdmin - A web interface for MySQL and MariaDB.
- [x] [Certbot](https://hub.docker.com/r/certbot/certbot) - Official build of EFF's Certbot tool for obtaining TLS/SSL certificates from Let's Encrypt.
- [x] [Composer]
- [x] [Cron]
  
<br />
  
