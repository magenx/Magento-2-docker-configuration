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
  
- [x] Use init.sh script provided to install and configure docker environment:  
```
   curl -Lo init.sh https://raw.githubusercontent.com/magenx/Magento-2-docker-configuration/main/init.sh && . init.sh
```
<br />
  
**[ ! ]** Check all data, adjust your settings, add configs, edit your variables  
- [x] Run to pull and build images and start containers:   
```
   doco build --no-cache       
   doco up -d
```
- [x] Folders structure:   
```
root@docker:/opt/magenx# tree -L 3
.
├── data
│   ├── letsencrypt
│   │   └── renewal-hooks
│   ├── mariadb
│   │   ├── aria_log.00000001
│   │   ├── aria_log_control
│   │   ├── ib_buffer_pool
│   │   ├── ibdata1
│   │   ├── ib_logfile0
│   │   ├── magenx
│   │   ├── mariadb_upgrade_info
│   │   ├── multi-master.info
│   │   ├── mysql
│   │   ├── performance_schema
│   │   ├── sys
│   │   ├── undo001
│   │   ├── undo002
│   │   └── undo003
│   ├── opensearch
│   │   ├── batch_metrics_enabled.conf
│   │   ├── logging_enabled.conf
│   │   ├── logs
│   │   ├── nodes
│   │   ├── performance_analyzer_enabled.conf
│   │   ├── rca_enabled.conf
│   │   └── thread_contention_monitoring_enabled.conf
│   ├── phpmyadmin
│   ├── rabbitmq
│   │   └── mnesia
│   ├── redis
│   │   └── dump.rdb
│   └── ssl
├── docker
│   ├── composer
│   │   └── Dockerfile
│   ├── cron
│   │   └── Dockerfile
│   ├── docker-compose.yml
│   ├── init.sh
│   ├── LICENSE
│   ├── magento
│   │   ├── Dockerfile
│   │   └── entrypoint.sh
│   ├── mariadb
│   │   └── init.sql.gz
│   ├── nginx
│   │   └── Dockerfile
│   ├── opensearch
│   │   └── Dockerfile
│   ├── opensearch.sh
│   ├── passgen.sh
│   ├── php
│   │   ├── Dockerfile
│   │   ├── www.conf
│   │   └── zz-override.ini
│   ├── README.md
│   └── varnish
│       ├── default.vcl
│       └── Dockerfile
└── magento
    └── magenx
        ├── current -> releases/202509182334
        ├── releases
        └── shared
```

- [x] Watch syslog for errors and issues:
```
   tail -f /var/log/syslog
   doco logs -f
```

<br />
 
- [x] To request TLS/SSL certificate with certbot you can run this command [--staging] to test:  
```
  doco stop nginx  
  doco run -p 80:80 --rm certbot certonly \
  --email ${ADMIN_EMAIL} --agree-tos --register-unsafely-without-email --no-eff-email --standalone -d ${DOMAIN} --staging  
  doco start nginx  
```
> change your nginx configuration to uncomment tls/ssl  
> remove [--staging] flag to reissue live certificate  
- [x] To request TLS/SSL certificate with certbot in realtime you can run this command: 
```
  doco run --rm certbot certonly \
  --email ${ADMIN_EMAIL} --agree-tos --register-unsafely-without-email --no-eff-email --webroot -w ${ROOT_PATH} -d ${DOMAIN}  
  doco restart nginx
```

<br />

- [x] Get random mariadb root password from log:  
```
doco logs mariadb 2>&1 | grep GENERATED
magenx-mariadb   | 2021-11-16 08:48:17-05:00 [Note] [Entrypoint]: GENERATED ROOT PASSWORD: xxxxxxxx
```

<br />

- [x] Run commands on containers:  
```
doco run --rm php -v                                                                                                                                                                    0.0s 
PHP 8.4.11 (fpm-fcgi) (built: Aug  5 2025 22:23:54) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.4.11, Copyright (c) Zend Technologies
    with Zend OPcache v8.4.11, Copyright (c), by Zend Technologies
```
```
doco exec -it php top
Mem: 3724836K used, 185764K free, 26184K shrd, 97596K buff, 1507904K cached
CPU:   0% usr   3% sys   0% nic  93% idle   0% io   0% irq   3% sirq
Load average: 1.09 1.02 1.00 2/1022 23
  PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND
    1     0 php-mage S     229m   6%   1   0% {php-fpm84} php-fpm: master process (/etc/php84/php-fpm.conf)
   19     0 php-mage R     1636   0%   1   0% top
```
```
doco exec -it cache redis-cli -h cache -p 6380
cache:6380> AUTH
OK
cache:6380> info
# Server
redis_version:8.0.3
```
```	
doco run --rm magento n98 --version
n98-magerun2 9.1.0 (commit: 2db94c5) by valantic CEC
```
```
doco run --rm composer --version
Composer version 2.8.10 2025-07-10 19:08:33
```
```
doco run --rm certbot --version
certbot 5.0.0
```
```
doco run --rm nginx -v
nginx version: nginx/1.29.1
```

<br />

- [x] Take down all services:
```
   doco down
   
[+] Running 14/14
 ✔ Container session     Removed                                                                                                                                                                   0.6s 
 ✔ Container phpmyadmin  Removed                                                                                                                                                                   0.4s 
 ✔ Container composer    Removed                                                                                                                                                                   0.0s 
 ✔ Container magento     Removed                                                                                                                                                                   0.0s 
 ✔ Container cron        Removed                                                                                                                                                                  10.3s 
 ✔ Container opensearch  Removed                                                                                                                                                                   1.0s 
 ✔ Container rabbitmq    Removed                                                                                                                                                                   1.5s 
 ✔ Container varnish     Removed                                                                                                                                                                   0.8s 
 ✔ Container certbot     Removed                                                                                                                                                                   0.0s 
 ✔ Container cache       Removed                                                                                                                                                                   0.5s 
 ✔ Container nginx       Removed                                                                                                                                                                   0.5s 
 ✔ Container php         Removed                                                                                                                                                                   0.4s 
 ✔ Container mariadb     Removed                                                                                                                                                                   0.5s 
 ✔ Network magenx        Removed
```
  
<br />

# :hammer_and_wrench: Stack components in use:  
- [x] [MariaDB](https://hub.docker.com/r/mariadb) - MariaDB Server is a high performing open source relational database, forked from MySQL.
- [x] [Nginx](https://hub.docker.com/r/nginx) - Official build of Nginx.
- [x] [PHP](https://hub.docker.com/r/php) - PHP scripting language.
- [x] [Varnish](https://hub.docker.com/r/varnish) - Varnish is an HTTP accelerator designed for content-heavy dynamic web sites as well as APIs.
- [x] [OpenSearch](https://hub.docker.com/r/opensearchproject) - Opensearch is a powerful open source search and analytics engine that makes data easy to explore.
- [x] [Redis x2](https://hub.docker.com/r/redis) - Redis is an open source key-value store that functions as a data structure server.
- [x] [RabbitMQ](https://hub.docker.com/r/rabbitmq) - RabbitMQ is an open source multi-protocol messaging broker.
- [x] [PHPMyAdmin](https://hub.docker.com/r/phpmyadmin) - phpMyAdmin - A web interface for MySQL and MariaDB.
- [x] [Certbot](https://hub.docker.com/r/certbot/certbot) - Official build of EFF's Certbot tool for obtaining TLS/SSL certificates from Let's Encrypt.
- [x] [Cron]
  
<br />
  
