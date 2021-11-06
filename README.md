## Docker Configuration for Magento 2  
> Deploy secure and flexible development infrastructure for Magento 2 in a matter of seconds.

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
```
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

- [x] Run composer command from host:
```
   docker-compose run composer update
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
