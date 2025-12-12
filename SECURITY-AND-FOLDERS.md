# Security and Mounted Folders Structure

## Security Features

### 1. **User Namespace Remapping**
- Docker daemon configured with `userns-remap: default`
- Automatically creates `dockremap` user with UID/GID mapping
- Containers run with remapped UIDs (10xxxx range) for isolation
- Configured in `/etc/docker/daemon.json`

### 2. **Container User Isolation**
Each service runs as a non-root user with specific UID:
- **PHP/Magento**: UID 1001 (`php-magenx`)
- **Nginx**: UID 8080
- **MariaDB**: UID 3306
- **Redis Cache**: UID 6380
- **Redis Session**: UID 6379
- **RabbitMQ**: UID 5672
- **OpenSearch**: UID 9200
- **Varnish**: UID 6082
- **ImgProxy**: UID 4593

### 3. **Network Segmentation**
Two isolated Docker networks:
- **frontend**: Public-facing services (nginx, varnish, cache, session, opensearch, rabbitmq, imgproxy, cron)
- **backend**: Database services (mariadb, php, cron, magento)

### 4. **Password Security**
- Random 32-character passwords generated for all services (alphanumeric + special chars: `%&?`)
- Random 6-character paths for admin and RabbitMQ endpoints
- 12-character random profiler token
- MariaDB root password auto-generated and logged once
- All passwords stored in `.env` file (excluded from git)

### 5. **File System Permissions**
**Data directories** (read-write for service users):
```
UID:UID ownership with 2770 permissions
ACL: u:UID:rwX,g:UID:rwX,o::-
```

**Application directories**:
- **Releases**: Magento UID (rwX), PHP GID (r-X), Nginx UID (r-X)
- **Shared/Public**: Magento UID (rwX), PHP GID (rwX), Nginx UID (r-X)
- **Media**: Additional ImgProxy UID read access (r-X)

### 6. **Container Security Hardening**
- **ulimits**: Increased file descriptors (65536) and memlock (-1)
- **capabilities**: SYS_PTRACE only (for PHP debugging)
- **read-only mounts**: Application code mounted read-only for nginx and php-fpm
- **tmpfs**: Varnish uses tmpfs for cache (64MB, mode 1770)
- **no privileged mode**: All containers run unprivileged

### 7. **Service Security Configuration**
- **PHP**: `expose_php=Off`, `display_errors=Off`, opcache enabled
- **Redis**: Password protected, maxmemory policies, lazyfree enabled
- **OpenSearch**: SSL transport disabled (internal network), admin password required
- **RabbitMQ**: Custom vhost, user authentication required
- **Varnish**: ACL for PURGE requests (internal networks only), X-Powered-By/Server headers removed

### 8. **Health Checks**
Containers monitored with health checks:
- **MariaDB**: Connection, InnoDB initialization, buffer pool status
- **Redis Session**: Ping with authentication
- **Varnish**: Admin ping
- **ImgProxy**: Built-in health endpoint
- **OpenSearch**: Cluster health check with authentication

### 9. **Logging**
- Syslog driver for centralized logging
- Non-blocking mode to prevent container hangs
- Tagged with container names: `[ {{.Name}} ]`

### 10. **Image Security**
- Official images used with SHA256 digest pinning
- Images from: Docker Hub, GitHub Container Registry (ghcr.io)
- Debian Trixie-slim base for PHP/Magento containers
- Alpine-based images for Nginx, Redis, Varnish, RabbitMQ

---

## Mounted Folders Structure

### Root Directory: `/opt/magenx/`

```
/opt/magenx/
├── data/                              # Persistent data for services
│   ├── mariadb/                       # MariaDB database files (UID 103306)
│   │   └── /var/lib/mysql            # Mounted to container
│   ├── opensearch/                    # OpenSearch data (UID 109200)
│   │   ├── /usr/share/opensearch/data
│   │   └── logs/                      # OpenSearch logs
│   ├── redis-cache/                   # Redis cache data (UID 106380)
│   │   └── /data                      # Mounted to container
│   ├── redis-session/                 # Redis session data (UID 106379)
│   │   └── /data                      # Mounted to container
│   ├── rabbitmq/                      # RabbitMQ data (UID 105672)
│   │   └── /var/lib/rabbitmq         # Mounted to container
│   └── nginx/                         # Nginx runtime data (UID 108080)
│       ├── log/                       # Access and error logs
│       └── cache/                     # Nginx cache directory
│
├── magento/                           # Magento application root
│   ├── public/                        # Public web root symlink
│   │   └── current -> releases/202509182334  # Symlink to active release
│   ├── releases/                      # Deployment releases (atomic deploys)
│   │   └── 202509182334/             # Timestamped release directory
│   │       ├── app/
│   │       ├── bin/
│   │       ├── vendor/
│   │       └── ...                    # Full Magento installation
│   └── shared/                        # Shared data across releases
│       ├── var/                       # Runtime data (logs, cache, tmp)
│       │   └── tmp/                   # Upload and temp directory
│       └── pub/media/                 # User-uploaded media files
│
└── docker/                            # Docker configuration
    ├── docker-compose.yml
    ├── .env                           # Environment variables & passwords
    ├── php/
    ├── nginx/
    ├── mariadb/
    ├── varnish/
    └── ...
```

### Container Mount Points

#### PHP Container
```yaml
volumes:
  - ${APP_PATH}/public:${ROOT_PATH}/public:ro           # Read-only code
  - ${APP_PATH}/shared/var:${ROOT_PATH}/shared/var      # Read-write runtime
  - ${APP_PATH}/shared/pub/media:${ROOT_PATH}/shared/pub/media  # Read-write media
  - ${APP_PATH}/releases:${ROOT_PATH}/releases          # Read-write releases
```

#### Nginx Container
```yaml
volumes:
  - ${APP_PATH}/public:${ROOT_PATH}/public:ro           # Read-only code
  - ${APP_PATH}/shared/var:${ROOT_PATH}/shared/var:ro   # Read-only runtime
  - ${APP_PATH}/shared/pub/media:${ROOT_PATH}/shared/pub/media:ro  # Read-only media
  - ${APP_PATH}/releases:${ROOT_PATH}/releases:ro       # Read-only releases
  - ${DATA_PATH}/nginx/log:/var/log/nginx               # Logs
  - ${DATA_PATH}/nginx/cache:/var/cache/nginx           # Cache
```

#### Magento Container (CLI/Deployment)
```yaml
volumes:
  - ${APP_PATH}/public:${ROOT_PATH}/public              # Read-write code
  - ${APP_PATH}/shared/var:${ROOT_PATH}/shared/var      # Read-write runtime
  - ${APP_PATH}/shared/pub/media:${ROOT_PATH}/shared/pub/media  # Read-write media
  - ${APP_PATH}/releases:${ROOT_PATH}/releases          # Read-write releases
```

#### Cron Container
```yaml
volumes:
  - ${APP_PATH}/public:${ROOT_PATH}/public              # Read-write code
  - ${APP_PATH}/shared/var:${ROOT_PATH}/shared/var      # Read-write runtime
  - ${APP_PATH}/shared/pub/media:${ROOT_PATH}/shared/pub/media  # Read-write media
  - ${APP_PATH}/releases:${ROOT_PATH}/releases          # Read-write releases
```

#### ImgProxy Container
```yaml
volumes:
  - ${APP_PATH}/shared/pub/media:${ROOT_PATH}/shared/pub/media:ro  # Read-only media
```

#### MariaDB Container
```yaml
volumes:
  - ${DATA_PATH}/mariadb:/var/lib/mysql                 # Database files
  - ./mariadb/config:/etc/mysql/conf.d:ro               # Read-only config
```

#### OpenSearch Container
```yaml
volumes:
  - ${DATA_PATH}/opensearch:/usr/share/opensearch/data  # Data files
  - ${DATA_PATH}/opensearch/logs:/usr/share/opensearch/logs  # Logs
```

#### Redis (Cache/Session) Containers
```yaml
volumes:
  - ${DATA_PATH}/redis-cache:/data                      # Cache persistence
  - ${DATA_PATH}/redis-session:/data                    # Session persistence
```

#### RabbitMQ Container
```yaml
volumes:
  - ${DATA_PATH}/rabbitmq:/var/lib/rabbitmq             # Queue data
```

#### Varnish Container
```yaml
volumes:
  - type: tmpfs                                          # Volatile cache
    target: /var/lib/varnish/varnishd:exec
    tmpfs:
      size: 64m
      mode: 1770
```

---

## Environment Variables (`.env`)

### Paths
- `DOCKER_CONFIG_ROOT`: `/opt/magenx` (default)
- `DATA_PATH`: `${DOCKER_CONFIG_ROOT}/data`
- `APP_PATH`: `${DOCKER_CONFIG_ROOT}/magento`
- `ROOT_PATH`: `/home/magenx` (container internal path)
- `CURRENT_SYMLINK`: `public/current` (active deployment)

### Security Tokens
- Auto-generated during setup via `scripts/random_generator.sh`
- Stored in `.env` file
- Includes: Redis, RabbitMQ, MariaDB, OpenSearch passwords
- Admin and RabbitMQ paths randomized

---

## Key Security Notes

1. **Principle of Least Privilege**: Each container runs with minimal necessary permissions
2. **Defense in Depth**: Multiple layers (user namespaces, UIDs, networks, ACLs)
3. **Immutable Infrastructure**: Code mounted read-only where possible
4. **Secrets Management**: Passwords generated randomly and stored securely
5. **Network Isolation**: Services only exposed to required networks
6. **File System Protection**: ACLs enforce strict access control
7. **Container Hardening**: No privileged containers, minimal capabilities
8. **Logging**: Centralized syslog for security monitoring
9. **Image Verification**: SHA256 digest pinning prevents supply chain attacks
10. **Health Monitoring**: Automated health checks detect compromised services
