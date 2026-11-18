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
                               [ nginx ]  nginx/templates, from magenx/Magento-nginx-config
                              │       │
                         [ php-fpm ]  [ imgproxy ]  image resize / webp / avif
                              │
   ┌──────────────┬───────────┼────────────┬──────────────┐
[ mariadb ]   [ cache ]   [ session ]  [ rabbitmq ]  [ opensearch ]
              valkey      valkey

 admin browser --> Cloudflare Access --tunnel--> [ cloudflared ] --> nginx:8081  Magento admin, /rabbitmq/, /mariadb/
                                                                     [ adminer ]  MariaDB web UI (profile adminer)

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
4. Adds alias `doco='docker compose'` and `export COMPOSE_ENV_FILES=.env,.env.secrets` to `~/.bashrc`, so compose loads both env files in every shell (`screen`, `su` without `-` too), and makes `~/.bash_profile` source `~/.bashrc` for login shells.
5. Clones this repository into `/opt/BRAND/docker` and moves you there.
6. Copies `.env.template` to `.env` and `.env.secrets.template` to `.env.secrets` and **opens both in `vim`** (see Step 2).
7. `scripts/random_generator.sh` appends random passwords for all services, plus a random admin path and profiler key, to `.env.secrets`.
8. `scripts/web_directory.sh` creates the `/opt/BRAND/magento` release layout, first release folder and `current` symlink, sets owner `165532`, permissions and ACL.
9. Tightens permissions on `/opt/BRAND/docker`, sets `.env.secrets` to `600` and raises kernel key limits (`/etc/sysctl.d/99-docker-maxkeys.conf`).

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
| `TUNNEL_TOKEN` | `.env.secrets`: Cloudflare Tunnel token for the private admin hostname, see [Private admin access](#lock-private-admin-access-cloudflare) |
| `CRYPT_KEY` / `GRAPHQL_ID_SALT` | `.env.secrets`: Magento keys (set before install, keep secret) |
| `TIMEZONE` | e.g. `Europe/Berlin` |

Optional: memory sizes (`VALKEY_*_SIZE`, `VARNISH_SIZE`, `OPENSEARCH_XMS/XMX`), `PHP_EXTENSION`, `PIE_MODULES`, PHP 8.4 / 8.5 image block, imgproxy settings, `COMPOSE_PROFILES="adminer"` for the MariaDB web UI.  
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
- **nginx** gets the `zstd` module compiled and configs rendered from `nginx/templates` with `envsubst`. Every server block in `sites-available` is enabled: the shop on `nginx:80` behind varnish, and the private admin vhost on `nginx:8081` for cloudflared.
- **cloudflared** is the Cloudflare Tunnel client on its hardened image, see [Private admin access](#lock-private-admin-access-cloudflare).
- **adminer** (profile `adminer`) is the `adminer` target of the php image: php-fpm with the MySQL-only Adminer file.
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

> Save the admin password shown in the output. Then move the admin to the private hostname, see [Magento admin URL](#magento-admin-url). Until then the admin is on `https://DOMAIN/ADMIN_PATH` (`ADMIN_PATH` is in `.env.secrets`) for the addresses in `nginx/templates/ipset/allow.conf` only.

<br />

# :lock: Private admin access (Cloudflare)
Magento admin, RabbitMQ management (`/rabbitmq/`) and Adminer (`/mariadb/`) on one private hostname, with no public admin path and no `ipset/allow.conf` addresses to keep up to date. cloudflared starts with the stack: the shop's DNS is on Cloudflare, so it is one more step there and admins need only a browser. Who may open which tool is decided by Cloudflare Access applications, listed in the App Launcher. The Zero Trust free plan covers 50 users.

cloudflared sends everything to one admin-only nginx vhost, `nginx:8081` (`nginx/templates/sites-available/private_admin.conf`), never published on the host. Varnish is not in this path, so admin pages are never cached:
```
 https://<private hostname>/ADMIN_PATH/  -> Magento admin (/ and paths not listed here answer 404)
 https://<private hostname>/rabbitmq/    -> rabbitmq:15672   (management path_prefix, RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS)
 https://<private hostname>/mariadb/     -> adminer:9000     (php-fpm, adminer profile)
```
The tools keep their own logins: RabbitMQ user `BRAND` with `RABBITMQ_PASSWORD`, Adminer the MariaDB user (`MARIADB_USER` / `MARIADB_PASSWORD` from `.env.secrets`, server `mariadb`). Adminer runs only with the `adminer` profile: the MySQL-only release of [Adminer](https://www.adminer.org) (`ADMINER_VERSION`, checked against `ADMINER_SHA256` at build time) on the stack's own php-fpm image with `pdo_mysql`, target `adminer` of `php/Dockerfile`. No PostgreSQL, SQLite or other drivers, no environment in the workers, sessions on a tmpfs. Started while nginx is already running, `/mariadb/` answers 502 for up to 30 seconds, until nginx resolves the new container (`resolver ... valid=30s`).

### Cloudflare (starts with the stack)
```
 admin browser --HTTPS--> Cloudflare edge (Access login, App Launcher) --tunnel--> cloudflared container (outbound only)
   https://<private hostname>  -> http://nginx:8081   Magento admin, /rabbitmq/, /mariadb/
```
- Image: built from `cloudflared/Dockerfile` on the `CLOUDFLARED_IMAGE` base, released with the other stack images.
- Settings: the `TUNNEL_*` variables in `.env`, `TUNNEL_TOKEN` in `.env.secrets`. The tunnel is managed in the dashboard: one hostname to `http://nginx:8081` (the paths behind it are in this repository). The container joins `frontend`.
- The hostname is in public DNS and shows up in certificate logs. Without a login accepted by Access, requests stop at Cloudflare and never reach the server: nothing on the server listens for this hostname publicly, so Access cannot be bypassed. Pick a neutral name, not `admin.`.

Setup, once:
1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com): create the organization (team name) on the free plan. Login methods, under **Integrations > Identity providers > Add new identity provider**: **One-time PIN** (a code by email; new organizations do not get it automatically), or Google, Microsoft or GitHub with MFA enforced there. Admins need no Cloudflare account. Optionally create an Access group (Access controls > Access groups, e.g. `magento-admins`) and use it in every policy below, so adding or removing a person is one edit.
2. Access controls > Applications > Add an application > Self-hosted, one application per tool, each with its own Allow policy (the group, or narrower emails) and shown in the App Launcher (`https://<team>.cloudflareaccess.com`):
   - `<private hostname>` (whole hostname, **empty path**): Magento admin. It also covers `/`, the admin's `/static/` and `/media/` and anything not listed below. With a path here (e.g. the admin path), every other path reaches nginx without a login. App Launcher URL: `https://<private hostname>/<ADMIN_PATH>/`. Session duration: a working day or less.
   - `<private hostname>/rabbitmq`, `<private hostname>/mariadb`: the tools, for fewer people if wanted. The more specific path wins.

   In each application, select the login methods to offer; with only one, turn on **Apply instant authentication**. A one-time PIN is only sent to an email its policy includes.
3. Networks > Tunnels > Create a tunnel > Cloudflared. Copy the token from the docker command into `.env.secrets`:
```
TUNNEL_TOKEN="eyJ..."
```
4. Tunnel > Published application routes (older dashboards: Public hostnames): add the private hostname, service type HTTP, URL `nginx:8081`. Add it only after the Access applications from step 2 exist. Not Networks > Routes: hostname and CIDR routes there are private network routes that only devices with the Cloudflare One client can use. Check from a machine without a login: every path must redirect to the Access login, never to a path on the hostname:
```
curl -sI https://<private hostname>/ | grep -i '^location'
curl -sI https://<private hostname>/anything | grep -i '^location'
```
5. Add `adminer` to `COMPOSE_PROFILES` in `.env` for the MariaDB UI. Build and start the containers (with the release workflow the images come from the release instead). The tunnel shows Healthy in the dashboard, the containers turn `healthy`:
```
doco up -d --build nginx rabbitmq cloudflared adminer
```
6. Magento admin URL `https://<private hostname>/`, see [Magento admin URL](#magento-admin-url).

Admins:
- Sign in once at the App Launcher (`https://<team>.cloudflareaccess.com`), which lists the applications each admin's policies allow, or open a tool's URL directly.
- Add or remove: edit the Access group (or the emails in the policies), or the group in the login provider. Ongoing sessions: My Team > Users > Revoke.
- Magento admin: `https://<private hostname>/<ADMIN_PATH>/` (`/` answers 404). RabbitMQ: `https://<private hostname>/rabbitmq/`, Adminer: `/mariadb/`. MariaDB from a desktop client: SSH tunnel to the published `127.0.0.1:3306`: `ssh -L 3306:127.0.0.1:3306 user@server`.
- If admin pages fail on blocked XHR requests, check Security > Events for challenges on the private hostname and add a WAF skip rule for it.

> [!WARNING]
> Anyone who can edit the tunnel in the Zero Trust dashboard can publish any service on the `frontend` network, OpenSearch and Valkey included. Give dashboard roles to as few people as possible, and never add a public hostname without an Access application in front of it.

### Magento admin URL
Point the Magento admin to the private hostname (the trailing slash is required). After this the admin answers there only:
```
doco run --rm magento config:set admin/url/use_custom 1
doco run --rm magento config:set admin/url/custom https://<private hostname>/
doco run --rm magento cache:flush
```
- Magento also stores the custom URL as base URL of the admin store (`stores` / `0`), so admin static files and media load from the private hostname too, no CORS. Keep `web/secure/base_static_url` and `base_media_url` empty or on `{{secure_base_url}}`: an absolute URL to `DOMAIN` or a CDN breaks the admin (Knockout templates and fonts need CORS). Check:
```
. .env.secrets && doco exec -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb mariadb -uroot BRAND -e "SELECT scope, scope_id, path, value FROM core_config_data WHERE path LIKE 'web/%base%url' OR path LIKE 'admin/url/%'"
```
- Leave `nginx/templates/ipset/allow.conf` empty: the admin path on `DOMAIN` then answers 403 to everyone.
- Back to the admin on `DOMAIN`: `config:set admin/url/use_custom 0`, then run the check above. Delete the `stores` / `0` `web/secure/base_url` and `web/unsecure/base_url` rows if they still hold the private hostname, flush the cache and add the addresses to `ipset/allow.conf` again.

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
- Import a SQL dump into the `BRAND` database. `-T` turns off the TTY, otherwise compose stops with `cannot attach stdin to a TTY-enabled container`. The password goes in `MYSQL_PWD`: `-p` asks on a terminal, there is none. A dump usually drops and recreates its tables, so back up the current database first:
```
. .env.secrets && doco exec -T -e MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb mariadb -uroot BRAND < backup.sql
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
3. Scans the changed images with [Trivy](https://trivy.dev) (`scripts/scan_images.sh`, vulnerabilities only). A CRITICAL or HIGH CVE that has a fixed version fails the build, CVEs without a fix are listed in the job summary.
4. Starts the stack with `docker-compose.ci.yml` (json-file logging, varnish and the private admin vhost on localhost), waits for all health checks, checks php extensions, composer, `nginx -t` and `cloudflared version`, then the private admin vhost: `/` answers 404, `/rabbitmq/` the RabbitMQ UI and `/mariadb/` the Adminer login page. Generates an SPDX SBOM of every image with [Syft](https://github.com/anchore/syft).
5. Pushes the new images and tags all 12 (`adminer` included, whatever `COMPOSE_PROFILES` says) with the release version as well (`BRAND-<service>:X.Y.Z`, same digest as the fingerprint tag). Attaches `docker-compose.release.yml` with the digests of all images and `sbom.tar.gz` (one SPDX file per image) to the draft release. Unchanged images keep their digest, so the server does not recreate those containers.
6. Publishes the release.

`.github/workflows/image-scan.yml` scans the images of the latest release every night for CVEs published since the release. Findings go into one open issue with label `image-cve`, which is updated and commented when they change and closed on a clean run.

Repository setup:
- Commit `.env` with the shop settings. `nginx/templates` is in the repository: edit it there. Never commit `.env.secrets` unencrypted.
- Variable `BUILD_IMAGES=true`. Without it only the release is published, no images.
- Variable `BUILD_RUNNER`: `ubuntu-latest` (amd64, default) or `ubuntu-24.04-arm` (arm64), same arch as the server.
- Variable `BUILD_EPOCH` (optional, default `0`): bump it to rebuild all images on the next release. The fingerprint does not see unpinned downloads during the build (apt packages, n98-magerun2).
- Secrets `DHI_USER`, `DHI_PAT`: `dhi.io` login.
- Secret `BUILD_SECRETS`: the lines from the server `.env.secrets` that are built into images: `OPENSEARCH_ADMIN_PASSWORD`, `ADMIN_PATH`, `PROFILER`. All other passwords in CI are throwaway values.
- Settings > Actions > General: allow GitHub Actions to create pull requests (release-please).
- Settings > General > Releases: enable release immutability, so a published release and its lock file cannot change.

Deploy a release on the server (`.env` and `.env.secrets` stay on the server, `docker login ghcr.io` with a classic PAT with `read:packages`):
```
gh release download vX.Y.Z -p docker-compose.release.yml --clobber
doco -f docker-compose.yml -f docker-compose.release.yml pull
doco -f docker-compose.yml -f docker-compose.release.yml up -d --no-build
```
Roll back: download the lock file of the previous release and run the same commands.

A CVE scan fails a release or opens the `image-cve` issue:
- update the base image digest or the package; for unpinned apt packages bump `BUILD_EPOCH`
- if the fix cannot be taken yet or the package is not used at runtime, add the CVE id to `.trivyignore` with the image, the reason and a review date

Which images contain a library, e.g. after a new CVE: download the SBOMs of the release and search them:
```
gh release download vX.Y.Z -p sbom.tar.gz && tar -xzf sbom.tar.gz
jq -r '.packages[] | "\(.name) \(.versionInfo)"' php.spdx.json | grep -i openssl
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
- [x] [cloudflared](https://hub.docker.com/hardened-images/catalog/dhi/cloudflared) - Cloudflare Tunnel client, private admin access behind Cloudflare Access.
- [x] [Adminer](https://www.adminer.org) - MariaDB web UI, MySQL-only release on the php-fpm image (profile `adminer`).
  
<br />
