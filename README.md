## Docker Configuration for Magento 2  
> Deploy secure and flexible docker infrastructure for Magento 2 in a matter of seconds.


<img width="124" height="" src="https://user-images.githubusercontent.com/1591200/117845471-7abda280-b278-11eb-8c88-db3fa307ae40.jpeg"/> <img width="112" height="" src="https://github.com/user-attachments/assets/941d358e-785d-4d5c-9903-720255e10c52"/> <img width="112" height="" src="https://user-images.githubusercontent.com/1591200/139601566-f4a62101-1ead-462e-a360-6397437de5cb.png"/> <img width="112" height="" src="https://user-images.githubusercontent.com/1591200/130320410-91749ce8-5af1-4802-af25-ffb36e7ded98.png"/>

<br />

> [!NOTE]
> By default the latest package versions are configured, above those recommended by Magento 2.  
> All images are [Docker Hardened Images](https://hub.docker.com/hardened-images/catalog) (`dhi.io`), pinned by SHA256 digest in `.env`.  
> This is a template. You are responsible for your server: permissions, upgrades, patches and security monitoring.

<br />

# :world_map: How it works

```
                 HOST_PRIVATE_IP:HOST_PRIVATE_PORT  (TLS terminated in front: load balancer / proxy)
                                  │
                              [ varnish ]  full page cache
                                  │
                               [ nginx ]  magento2 config from magenx/Magento-nginx-config
                              │       │
                         [ php-fpm ]  [ imgproxy ]  image resize / webp / avif
                              │
   ┌──────────────┬───────────┼────────────┬──────────────┐
[ mariadb ]   [ cache ]   [ session ]  [ rabbitmq ]  [ opensearch ]
              valkey      valkey

[ magento ]  one-off CLI container: bin/magento, composer, n98-magerun2
[ cron ]     supercronic runs bin/magento cron:run every minute
```

- **Networks:** `frontend` (web, cache, search, queue) and `backend` (database). MariaDB is only on `backend` and published on `127.0.0.1` only.
- **Code layout:** releases with a `current` symlink, same pattern as zero-downtime deploys:
  ```
  /opt/BRAND/
  ├── docker/                       this repository + .env
  └── magento/
      ├── releases/YYYYMMDDHHMM/    magento code (one folder per release)
      ├── public/current -> ../releases/YYYYMMDDHHMM
      └── shared/                   persistent data, survives releases
          ├── var/
          └── pub/media/
  ```
- **Read-only code:** `php`, `nginx` and `cron` mount `releases` and `public` read-only. Only the `magento` CLI container can write code. `shared/var` and `shared/pub/media` are writable.
- **User namespace remap:** docker daemon runs with `userns-remap: default`. Container UID `65532` (hardened image user) maps to host UID `165532`, so host files are owned by `165532`.
- **Logs:** every container logs to host syslog, tagged `[ container_name ]`.

More details: [SECURITY-AND-FOLDERS.md](SECURITY-AND-FOLDERS.md)

<br />

# :rocket: Deploy your project

### Requirements
- Fresh Linux host: Debian 12/13 or Ubuntu 22/24, root access.
- [Docker Hub](https://hub.docker.com/) account with a Personal Access Token (for `dhi.io` hardened images).
- [Magento Marketplace](https://commercemarketplace.adobe.com/customer/accessKeys/) access keys (for `repo.magento.com`).
- Domain name, and a load balancer / proxy in front for TLS.

<br />

### Step 1. Bootstrap host with `docker.sh`
> replace `BRAND` with your brand name, e.g. `magenx`. It becomes the project name, users, paths, DB name, queue vhost and search index prefix.
```
curl -Lo docker.sh https://raw.githubusercontent.com/magenx/Magento-2-docker-configuration/main/docker.sh && . docker.sh BRAND
```
```
curl -LO magenx.sh/docker.sh && . docker.sh BRAND
```

What the script does, in order:
1. Asks you to agree to the terms.
2. Writes `/etc/docker/daemon.json` with `"userns-remap": "default"`.
3. Adds the official Docker apt repo, upgrades the system and installs `docker-ce`, `buildx`, `compose` plugin, plus `git vim screen syslog-ng-core ufw apache2-utils acl`.
4. Adds alias `doco='docker compose'` to `~/.bash_profile`.
5. Clones this repository into `/opt/BRAND/docker` and moves you there.
6. Copies `.env.template` to `.env` and **opens it in `vim`** (see Step 2).
7. `scripts/random_generator.sh` appends random passwords for all services, plus random admin / rabbitmq / adminer paths and profiler key, to `.env`.
8. `scripts/web_directory.sh` creates the `/opt/BRAND/magento` release layout, first release folder and `current` symlink, sets owner `165532`, permissions and ACL.
9. `scripts/get_nginx_config.sh` pulls magento2 nginx configs from [magenx/Magento-nginx-config](https://github.com/magenx/Magento-nginx-config) into `nginx/templates` (rendered with `envsubst` at build time).
10. Tightens permissions on `/opt/BRAND/docker` and raises kernel key limits (`/etc/sysctl.d/99-docker-maxkeys.conf`).

> [!WARNING]
> `scripts/random_generator.sh` deletes everything below `## generated passwords for services` in `.env` and writes new values.  
> Do not re-run it after deployment, or your services and database credentials will no longer match.

<br />

### Step 2. Edit `.env`
`vim` opens during Step 1. Required values:

| Variable | What to set |
|---|---|
| `BRAND` | same brand name you passed to `docker.sh` |
| `DOMAIN` | shop domain, e.g. `domain.com` |
| `HOST_PRIVATE_IP` / `HOST_PRIVATE_PORT` | host IP:port where varnish listens (your load balancer target) |
| `COMPOSER_AUTH` | your own `repo.magento.com` keys |
| `CRYPT_KEY` / `GRAPHQL_ID_SALT` | Magento keys (set before install, keep secret) |
| `TIMEZONE` | e.g. `Europe/Berlin` |

Optional: memory sizes (`VALKEY_*_SIZE`, `VARNISH_SIZE`, `OPENSEARCH_XMS/XMX`), `PHP_EXTENSION`, `PIE_MODULES`, PHP 8.4 / 8.5 image block, imgproxy settings.  
After Step 1 finishes, check the generated passwords at the end of `.env`.

<br />

### Step 3. Login to hardened images registry
Create a token: `https://app.docker.com/accounts/<YOUR DOCKERHUB USERNAME>/settings/personal-access-tokens`
```
docker login dhi.io
Username: <YOUR DOCKERHUB USERNAME>
Password: <PAT>
```

<br />

### Step 4. Build images and start containers
Run all commands from `/opt/BRAND/docker`:
```
cd /opt/BRAND/docker
doco up -d --build
doco ps
```
What happens on build:
- **php** image is built once with 3 targets: `php` (php-fpm), `magento` (CLI + composer + n98-magerun2), `cron` (supercronic). PHP extensions compiled from source, `lz4`, `igbinary`, `phpredis` via PIE.
- **nginx** gets the `zstd` module compiled and configs rendered from templates.
- **varnish** gets `vmod_dynamic` compiled.
- **opensearch** gets `analysis-icu` and `analysis-phonetic` plugins.
- **valkey** builds 2 targets: `cache` (volatile) and `session` (RDB + AOF persistence).

Watch startup, wait for all health checks to show `healthy`:
```
tail -f /var/log/syslog
doco logs -f
```

<br />

### Step 5. Create service users
```
bash opensearch/create_user.sh   # role + user BRAND, access to BRAND* indices
bash rabbitmq/create_user.sh     # delete guest, add vhost BRAND, set permissions
```

<br />

### Step 6. Install Magento
```
bash scripts/install_magento.sh
```
What the script does:
1. Removes the `test` database, creates the `BRAND` database and user in MariaDB with passwords from `.env`.
2. `composer create-project` of `magento/project-community-edition` into the current release (`--no-install`).
3. Adds `replace` rules from `php/config/cli/composer_replace` to `composer.json` to drop unused modules.
4. `composer install`.
5. Asks `Execute magento setup:install? [y/n]`. With `y` it installs Magento connected to mariadb, valkey `session` + `cache`, rabbitmq and opensearch, admin user `admin` with random password.

> Save the admin password shown in the output. Admin URL: `https://DOMAIN/ADMIN_PATH` (`ADMIN_PATH` is in `.env`).

<br />

# :gear: Daily operations

- Magento CLI, composer, n98-magerun2 (one-off `magento` container, removed after run):
```
doco run --rm magento cache:flush
doco run --rm magento setup:upgrade
doco run --rm magento composer require vendor/module
doco run --rm magento n98 --version
```
- Commands inside running containers:
```
doco exec -it php php -v
doco exec -it php top
doco exec -it cache valkey-cli -h cache -p 6380 -a "$VALKEY_PASSWORD" info
doco exec -it session valkey-cli -h session -p 6379 -a "$VALKEY_PASSWORD" ping
doco exec -it nginx nginx -t
```
- Credentials: all passwords are in `/opt/BRAND/docker/.env` (`MARIADB_ROOT_PASSWORD`, `MARIADB_PASSWORD`, `VALKEY_PASSWORD`, `RABBITMQ_PASSWORD`, `OPENSEARCH_PASSWORD`, `OPENSEARCH_ADMIN_PASSWORD`).
- Database shell:
```
. .env && doco exec -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb mariadb -uroot
```
- Rebuild one service after config change:
```
doco up -d --build nginx
```
- Stop and remove containers (named volumes and `/opt/BRAND/magento` are kept):
```
doco down
```

<br />

# :hammer_and_wrench: Stack components in use
Docker Hardened Images - https://hub.docker.com/hardened-images/catalog  
Versions below match `.env.template`, images are pinned by digest and updated by Renovate.
- [x] [MariaDB 11.4](https://hub.docker.com/hardened-images/catalog/dhi/mariadb) - high performing open source relational database, forked from MySQL.
- [x] [Nginx 1.31](https://hub.docker.com/hardened-images/catalog/dhi/nginx) - web server and reverse proxy, with zstd module.
- [x] [PHP 8.4](https://hub.docker.com/hardened-images/catalog/dhi/php) - PHP-FPM, Magento CLI with Composer 2 and n98-magerun2 (8.5 optional).
- [x] [Varnish 8](https://hub.docker.com/hardened-images/catalog/dhi/varnish) - HTTP accelerator, full page cache, with vmod_dynamic.
- [x] [OpenSearch 3](https://hub.docker.com/hardened-images/catalog/dhi/opensearch) - search and analytics engine, with ICU and phonetic analysis plugins.
- [x] [Valkey 8](https://hub.docker.com/hardened-images/catalog/dhi/valkey) - key-value store, separate `cache` and `session` instances.
- [x] [RabbitMQ 4](https://hub.docker.com/hardened-images/catalog/dhi/rabbitmq) - multi-protocol messaging broker for Magento queues.
- [x] [imgproxy 4](https://github.com/imgproxy/imgproxy) - fast image resizing and conversion (webp / avif) from `pub/media`.
- [x] [Supercronic](https://github.com/aptible/supercronic) - crontab-compatible job runner, designed for containers.
  
<br />
