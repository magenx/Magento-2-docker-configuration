# syntax = docker/dockerfile:labs

# =====================================================================
#  Single build definition for: php-fpm | magento cli | cron
#  Select with  build.target: php | magento | cron
# =====================================================================

# Global images ARG
ARG PHP_DEV_IMAGE
ARG PHP_FPM_IMAGE
ARG PHP_IMAGE
ARG PIE_IMAGE
ARG BUSYBOX_IMAGE
ARG COMPOSER_IMAGE

# ---------------------------------------------------------------------
#  Tool images
# ---------------------------------------------------------------------
FROM ${PIE_IMAGE}      AS pie
FROM ${BUSYBOX_IMAGE}  AS busybox
FROM ${COMPOSER_IMAGE} AS composer

# ---------------------------------------------------------------------
#  SHARED BUILDER php compiled once, consumed by all three targets
# ---------------------------------------------------------------------
FROM ${PHP_DEV_IMAGE} AS build

ARG PHP_EXTENSION
ARG MAGENTO_ROOT_PATH
ARG BRAND
ARG CURRENT_SYMLINK
ARG TIMEZONE

# Build dependencies for Magento extensions
RUN <<EOF
  set -e
  apt-get update
  apt --fix-broken install -y
  apt-get install -y --no-install-recommends \
  tzdata \
  wget \
  unzip \
  git \
  automake \
  gettext-base \
  build-essential \
  libjpeg-dev \
  libwebp-dev \
  libfreetype-dev \
  libpng-dev \
  libavif-dev \
  libxslt1.1 \
  libargon2-dev \
  default-libmysqlclient-dev \
  libxslt1-dev \
  libzip-dev \
  libcurl4-openssl-dev \
  libicu-dev \
  libonig-dev \
  libpcre2-dev \
  libssl-dev \
  libxml2-dev \
  liblz4-dev \
  zlib1g-dev
EOF

SHELL ["/bin/bash", "-c"]

WORKDIR ${PHP_SRC_DIR}

ARG PHP_CONFIGURE="./configure --with-php-config=${PHP_PREFIX}/bin/php-config"
ARG PHP_GD="--with-freetype --with-jpeg --with-webp --with-avif"
ARG PHP_XSL="--with-xsl"
ARG PHP_ZIP="--with-libzip"

# Compile extensions from PHP source
RUN <<EOF
  set -e
  for ext in ${PHP_EXTENSION}; do
    echo "=== Building $ext ==="
    if [ -d "ext/$ext" ]; then
      cd "ext/$ext"
      extension="PHP_${ext^^}"
      options="${!extension}"
      phpize
      ${PHP_CONFIGURE} $options
      make
      make install
      php_api_version=$(php -i | grep "PHP API =" | awk '{print $NF}')
      echo "extension=${PHP_PREFIX}/lib/php/extensions/no-debug-non-zts-${php_api_version}/${ext}.so" \
        > ${PHP_INI_DIR}/conf.d/${ext}.ini
      cd ${PHP_SRC_DIR}
      echo "=== Built $ext ==="
    else
      echo "=== $ext not in source ==="
      exit 1
    fi
  done
EOF

ARG PIE_MODULES
COPY --from=pie /pie /usr/local/bin/pie
RUN <<EOF
  set -e
  for pie_module in ${PIE_MODULES}; do
    phpredis=' --enable-redis-igbinary --enable-redis-lz4 --with-liblz4=/usr/'
    pie_module_options="${pie_module%/*}"
    pie install "$pie_module" ${!pie_module_options}
  done
EOF

# Collect runtime shared libraries pulled in by the compiled extensions
RUN <<EOF
  set -e
  mkdir -p /tmp/runtime-libs
  copy_deps() {
    for file in "$@"; do
      if [ -f "$file" ]; then
        ldd "$file" 2>/dev/null | grep "=> /" | awk '{print $3}' | while read dep; do
          if [ -f "$dep" ] && [ ! -f "/tmp/runtime-libs/$(basename "$dep")" ]; then
            cp "$dep" /tmp/runtime-libs/ 2>/dev/null || true
          fi
        done
      fi
    done
  }
  for so_file in ${PHP_PREFIX}/lib/php/extensions/no-debug-non-zts-*/*.so; do
    copy_deps "$so_file"
  done
  for lib in \
      /usr/lib/x86_64-linux-gnu/libgcrypt*.so* \
      /usr/lib/x86_64-linux-gnu/libgpg-error*.so* \
      /usr/lib/x86_64-linux-gnu/libbz2*.so*; do
      cp $lib /tmp/runtime-libs/ 2>/dev/null || true
  done
EOF

# Shared across all targets: app root + timezone
RUN <<EOF
  set -e
  mkdir -p ${MAGENTO_ROOT_PATH}
  cp /usr/share/zoneinfo/${TIMEZONE} /tmp/localtime
  echo ${TIMEZONE} > /etc/timezone
EOF

# ---------------------------------------------------------------------
#  PER-TARGET BUILD STAGES
# ---------------------------------------------------------------------
# php
FROM build AS build-php

ARG MAGENTO_ROOT_PATH
ARG DHI_STACK_UID
ARG CURRENT_SYMLINK
ARG BRAND

COPY config/fpm/ /tmp/fpm/

RUN <<EOF
  set -e
  mkdir -p ${PHP_PREFIX}/etc/php-fpm.d
  envsubst < /tmp/fpm/www.conf     > ${PHP_PREFIX}/etc/php-fpm.d/www.conf
  envsubst < /tmp/fpm/php-fpm.conf > ${PHP_PREFIX}/etc/php-fpm.conf
  install -m 644 /tmp/fpm/zz_override.ini ${PHP_INI_DIR}/conf.d/zz_override.ini
  touch ${PHP_PREFIX}/etc/php-fpm.d/{zz-docker.conf,docker.conf}
EOF

# magento
FROM build AS build-magento

ARG MAGENTO_ROOT_PATH
ARG CURRENT_SYMLINK
ARG BRAND

COPY config/cli/ /tmp/cli/

RUN <<EOF
  set -e
  envsubst < /tmp/cli/zz-cli-override.ini > ${PHP_INI_DIR}/conf.d/zz-cli-override.ini

  # n98-magerun2 — failure here fails the build
  mkdir -p /usr/local/bin/
  curl -sS -O https://files.magerun.net/n98-magerun2.phar
  curl -sS -o n98-magerun2.phar.sha256 "https://files.magerun.net/sha256.php?file=n98-magerun2.phar"
  shasum -a 256 -c n98-magerun2.phar.sha256
  mv n98-magerun2.phar /usr/local/bin/n98-magerun2
  chmod +x /usr/local/bin/n98-magerun2
  rm n98-magerun2.phar.sha256
EOF

# cron
FROM build AS build-cron

ARG MAGENTO_ROOT_PATH
ARG CURRENT_SYMLINK
ARG BRAND
ARG SUPERCRONIC
ARG SUPERCRONIC_SHA1SUM
ARG SUPERCRONIC_URL

COPY config/cli/ /tmp/cli/

RUN <<EOF
  set -e
  envsubst < /tmp/cli/zz-cli-override.ini > ${PHP_INI_DIR}/conf.d/zz-cli-override.ini

  curl -fsSL "${SUPERCRONIC_URL}" -o /tmp/${SUPERCRONIC}
  echo "${SUPERCRONIC_SHA1SUM}  /tmp/${SUPERCRONIC}" | sha1sum -c -
  chmod +x "/tmp/${SUPERCRONIC}"

  echo "* * * * * php ${MAGENTO_ROOT_PATH}/${CURRENT_SYMLINK}/bin/magento cron:run 2>&1" > ${MAGENTO_ROOT_PATH}/crontab
EOF

# =====================================================================
#  RUNTIME: php (service php)
# =====================================================================
FROM ${PHP_FPM_IMAGE} AS php

ARG MAGENTO_ROOT_PATH
ARG BRAND

COPY --from=build-php ${MAGENTO_ROOT_PATH}                  ${MAGENTO_ROOT_PATH}
COPY --from=build-php ${PHP_PREFIX}/lib/php/extensions/     ${PHP_PREFIX}/lib/php/extensions/
COPY --from=build-php ${PHP_PREFIX}/etc/php-fpm.d/          ${PHP_PREFIX}/etc/php-fpm.d/
COPY --from=build-php ${PHP_PREFIX}/etc/php-fpm.conf        ${PHP_PREFIX}/etc/php-fpm.conf
COPY --from=build-php ${PHP_INI_DIR}/conf.d/                ${PHP_INI_DIR}/conf.d/
COPY --from=build-php /etc/timezone                         /etc/timezone
COPY --from=build-php /tmp/localtime                        /etc/localtime
COPY --from=build-php /tmp/runtime-libs/                    /usr/lib/x86_64-linux-gnu/

# =====================================================================
#  RUNTIME: shared base for magento + cron
# =====================================================================
FROM ${PHP_IMAGE} AS magento-base

COPY --from=build ${PHP_PREFIX}/lib/php/extensions/ ${PHP_PREFIX}/lib/php/extensions/
COPY --from=build /etc/timezone                     /etc/timezone
COPY --from=build /tmp/localtime                    /etc/localtime
COPY --from=build /tmp/runtime-libs/                /usr/lib/x86_64-linux-gnu/

COPY --from=busybox /bin/busybox /bin/busybox
COPY --from=busybox /bin/sh      /bin/sh

# =====================================================================
#  RUNTIME: cron  (service cron)
# =====================================================================
FROM magento-base AS cron

ARG MAGENTO_ROOT_PATH
ARG SUPERCRONIC

COPY --from=build-cron ${PHP_INI_DIR}/conf.d/                       ${PHP_INI_DIR}/conf.d/
COPY --from=build-cron ${MAGENTO_ROOT_PATH}                         ${MAGENTO_ROOT_PATH}
COPY --from=build-cron /tmp/${SUPERCRONIC}                          /usr/local/bin/supercronic

# =====================================================================
#  RUNTIME: magento  (service magento) default target
# =====================================================================
FROM magento-base AS magento

ARG MAGENTO_ROOT_PATH
ARG BRAND

COPY --chmod=755 --from=build-magento /tmp/cli/entrypoint.sh      /entrypoint.sh

COPY --from=build-magento ${PHP_INI_DIR}/conf.d/          ${PHP_INI_DIR}/conf.d/
COPY --from=build-magento ${MAGENTO_ROOT_PATH}            ${MAGENTO_ROOT_PATH}
COPY --from=build-magento /usr/local/bin/n98-magerun2     /usr/local/bin/n98-magerun2

COPY --from=composer  /usr/local/bin/composer.phar    /usr/local/bin/composer

# more busybox tools
COPY --from=busybox /bin/ls    /bin/ls
COPY --from=busybox /bin/cat   /bin/cat
COPY --from=busybox /bin/echo  /bin/echo
COPY --from=busybox /bin/unzip /bin/unzip
COPY --from=busybox /bin/tar   /bin/tar
COPY --from=busybox /bin/env   /bin/env
