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
4. Adds alias `doco='docker compose'` and `export COMPOSE_ENV_FILES=.env,.env.secrets` to `~/.bash_profile`, so compose loads both env files.
5. Clones this repository into `/opt/BRAND/docker` and moves you there.
6. Copies `.env.template` to `.env` and `.env.secrets.template` to `.env.secrets` and **opens both in `vim`** (see Step 2).
7. `scripts/random_generator.sh` appends random passwords for all services, plus random admin / rabbitmq / adminer paths and profiler key, to `.env.secrets`.
8. `scripts/web_directory.sh` creates the `/opt/BRAND/magento` release layout, first release folder and `current` symlink, sets owner `165532`, permissions and ACL.
9. `scripts/get_nginx_config.sh` pulls magento2 nginx configs from [magenx/Magento-nginx-config](https://github.com/magenx/Magento-nginx-config) into `nginx/templates` (rendered with `envsubst` at build time). Run it once, then the templates are yours to edit.
10. Tightens permissions on `/opt/BRAND/docker`, sets `.env.secrets` to `600` and raises kernel key limits (`/etc/sysctl.d/99-docker-maxkeys.conf`).

> [!WARNING]
> `scripts/random_generator.sh` deletes everything below `## generated passwords for services` in `.env.secrets` and writes new values.  
> Do not re-run it after deployment, or your services and database credentials will no longer match.

<br />

### Step 2. Edit `.env` and `.env.secrets`
`vim` opens both during Step 1 (`:n` for the next file). Settings go in `.env`, secrets in `.env.secrets`.  
`.env.secrets` is in `.gitignore`. Keep it out of git or commit it encrypted, and back it up off the server: without `CRYPT_KEY` Magento cannot decrypt its stored config values.  
Required values:

| Variable | What to set |
|---|---|
| `BRAND` | same brand name you passed to `docker.sh` |
| `DOMAIN` | shop domain, e.g. `domain.com` |
| `HOST_PRIVATE_IP` / `HOST_PRIVATE_PORT` | host IP:port where varnish listens (your load balancer target) |
| `COMPOSER_AUTH` | `.env.secrets`: your own `repo.magento.com` keys |
| `CRYPT_KEY` / `GRAPHQL_ID_SALT` | `.env.secrets`: Magento keys (set before install, keep secret) |
| `TIMEZONE` | e.g. `Europe/Berlin` |

Optional: memory sizes (`VALKEY_*_SIZE`, `VARNISH_SIZE`, `OPENSEARCH_XMS/XMX`), `PHP_EXTENSION`, `PIE_MODULES`, PHP 8.4 / 8.5 image block, imgproxy settings.  
After Step 1 finishes, check the generated passwords at the end of `.env.secrets`.  
Compose stops with `missing, load .env.secrets` if it runs without the secrets file.

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
1. Removes the `test` database, creates the `BRAND` database and user in MariaDB with passwords from `.env.secrets`.
2. `composer create-project` of `magento/project-community-edition` into the current release (`--no-install`).
3. Adds `replace` rules from `php/config/cli/composer_replace` to `composer.json` to drop unused modules.
4. `composer install`.
5. Asks `Execute magento setup:install? [y/n]`. With `y` it installs Magento connected to mariadb, valkey `session` + `cache`, rabbitmq and opensearch, admin user `admin` with random password.

> Save the admin password shown in the output. Admin URL: `https://DOMAIN/ADMIN_PATH` (`ADMIN_PATH` is in `.env.secrets`).

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
. .env.secrets
doco exec -it cache valkey-cli -h cache -p 6380 -a "$VALKEY_PASSWORD" info
doco exec -it session valkey-cli -h session -p 6379 -a "$VALKEY_PASSWORD" ping
doco exec -it nginx nginx -t
```
- Credentials: all passwords are in `/opt/BRAND/docker/.env.secrets` (`MARIADB_ROOT_PASSWORD`, `MARIADB_PASSWORD`, `VALKEY_PASSWORD`, `RABBITMQ_PASSWORD`, `OPENSEARCH_PASSWORD`, `OPENSEARCH_ADMIN_PASSWORD`).
- Database shell:
```
. .env.secrets && doco exec -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb mariadb -uroot
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

# :package: Build, test and release images
For a per-customer repository: images are built in GitHub Actions, pushed to `ghcr.io` and the server only pulls them.  
`.github/workflows/release.yml` runs on every push to `main`:
1. [release-please](https://github.com/googleapis/release-please) keeps a release PR from [conventional commits](https://www.conventionalcommits.org/) (`fix:` patch, `feat:` minor, `feat!:` major). Merging it creates a **draft** release and tag `vX.Y.Z`.
2. `scripts/image_fingerprint.sh` hashes the inputs of each image: build args the Dockerfile declares (incl. base image digests), target, build context files and build secret. Images are tagged `ghcr.io/<owner>/BRAND-<service>:<fingerprint>`. A tag that already exists is reused, only changed images are built, with `docker buildx bake` from `docker-compose.yml` and a registry layer cache (`:buildcache`).
3. Starts the stack with `docker-compose.ci.yml` (json-file logging, varnish on localhost), waits for all health checks, checks php extensions, composer and `nginx -t`.
4. Pushes the new images and attaches `docker-compose.release.yml` with the digests of all images to the draft release. Unchanged images keep their digest, so the server does not recreate those containers.
5. Publishes the release.

Repository setup:
- Commit `.env` with the shop settings and `nginx/templates` (fetch once with `scripts/get_nginx_config.sh`, then edit them in the repo). Never commit `.env.secrets` unencrypted.
- Variable `BUILD_IMAGES=true`. Without it only the release is published, no images.
- Variable `BUILD_RUNNER`: `ubuntu-latest` (amd64, default) or `ubuntu-24.04-arm` (arm64), same arch as the server.
- Variable `BUILD_EPOCH` (optional, default `0`): bump it to rebuild all images on the next release. The fingerprint does not see unpinned downloads during the build (apt packages, n98-magerun2).
- Secrets `DHI_USER`, `DHI_PAT`: `dhi.io` login.
- Secret `BUILD_SECRETS`: the lines from the server `.env.secrets` that are built into images: `OPENSEARCH_ADMIN_PASSWORD`, `ADMIN_PATH`, `RABBITMQ_PATH`, `ADMINER_PATH`, `PROFILER`. All other passwords in CI are throwaway values.
- Settings > Actions > General: allow GitHub Actions to create pull requests (release-please).
- Settings > General > Releases: enable release immutability, so a published release and its lock file cannot change.

Deploy a release on the server (`.env` and `.env.secrets` stay on the server, `docker login ghcr.io` with a classic PAT with `read:packages`):
```
gh release download vX.Y.Z -p docker-compose.release.yml --clobber
doco -f docker-compose.yml -f docker-compose.release.yml pull
doco -f docker-compose.yml -f docker-compose.release.yml up -d --no-build
```
Roll back: download the lock file of the previous release and run the same commands.

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
