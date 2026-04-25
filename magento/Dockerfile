# syntax = docker/dockerfile:labs
# ============================================
# STAGE 1: BUILD EXTENSIONS IN DEV USING SOURCE
# ============================================
# Set variables for build
ARG PHP_USER
ARG PHP_UID
ARG MAGENTO_UID
ARG MAGENTO_ROOT_PATH
ARG BRAND
ARG PHP_IMAGE
ARG PHP_EXTENSION

# Set hash to pull exact image
ARG PHP_DEV_IMAGE
FROM ${PHP_DEV_IMAGE} AS builder

# Set variables for build
ARG PHP_EXTENSION
ARG PHP_USER
ARG MAGENTO_ROOT_PATH
ARG BRAND
ARG CURRENT_SYMLINK
ARG TIMEZONE

# Install ONLY missing build dependencies for Magento extensions
RUN <<EOF
  apt-get update
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
  rm -rf /var/lib/apt/lists/*
EOF

# Using bash
SHELL ["/bin/bash", "-c"]

# Go to PHP source directory
WORKDIR ${PHP_SRC_DIR}

# PHP config path
ARG PHP_CONFIGURE="./configure --with-php-config=${PHP_PREFIX}/bin/php-config"

# Extensions options
ARG PHP_GD="--with-freetype --with-jpeg --with-webp --with-avif"
ARG PHP_XSL="--with-xsl"
ARG PHP_ZIP="--with-libzip"

# Build extensions with their specific configure options
RUN <<EOF
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
    echo "extension=${PHP_PREFIX}/lib/php/extensions/no-debug-non-zts-${php_api_version}/${ext}.so" > ${PHP_INI_DIR}/conf.d/${ext}.ini
    cd ${PHP_SRC_DIR}
    echo "=== Built $ext ===";
  else
    echo "=== $ext not in source ===";
	exit 1
  fi;
  done
EOF


# Use PIE to install extensions
COPY --from=ghcr.io/php/pie:bin@sha256:66e2a1274ec15f1dda597ea716685bdeec44e9438eb9060901c0e7833a7f159a /pie /usr/local/bin/pie
RUN <<EOF
  pie install kjdev/lz4
  pie install apcu/apcu
EOF

# Collect required runtime libraries
RUN <<EOF
  mkdir -p /tmp/runtime-libs
  # Copy dependencies recursively
  copy_deps() {
    for file in "$@"; do
      if [ -f "$file" ]; then
        ldd "$file" 2>/dev/null | grep "=> /" | awk '{print $3}' | while read dep; do
          if [ -f "$dep" ] && [ ! -f "/tmp/runtime-libs/$(basename "$dep")" ]; then
            cp "$dep" /tmp/runtime-libs/ 2>/dev/null || true;
          fi;
        done;
      fi;
    done;
  }
  # Start with PHP and extensions
  for so_file in ${PHP_PREFIX}/lib/php/extensions/no-debug-non-zts-*/*.so; do
    copy_deps "$so_file"
  done
  # Also copy specific critical libraries
  for lib in \
      /usr/lib/x86_64-linux-gnu/libgcrypt*.so* \
      /usr/lib/x86_64-linux-gnu/libgpg-error*.so* \
      /usr/lib/x86_64-linux-gnu/libbz2*.so*; do
      cp $lib /tmp/runtime-libs/ 2>/dev/null || true;
  done
EOF

# Copy PHP config files
COPY config/* /tmp/

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh

RUN <<EOF
  set -e
  mkdir -p ${MAGENTO_ROOT_PATH}
  
  # Configure PHP
  envsubst < /tmp/zz-cli-override.ini >  ${PHP_INI_DIR}/conf.d/zz-cli-override.ini
  
  # Download n98-magerun2
  mkdir -p /usr/local/bin/
  curl -sS -O https://files.magerun.net/n98-magerun2.phar && \
    curl -sS -o n98-magerun2.phar.sha256 https://files.magerun.net/sha256.php?file=n98-magerun2.phar && \
	shasum -a 256 -c n98-magerun2.phar.sha256 && mv n98-magerun2.phar /usr/local/bin/n98-magerun2 && \
	chmod +x /usr/local/bin/n98-magerun2 && rm n98-magerun2.phar.sha256 && \
	echo "n98 installation successful" || echo "n98 installation failed"

  # Configure timezone
  cp /usr/share/zoneinfo/${TIMEZONE} /tmp/localtime
  echo ${TIMEZONE} > /etc/timezone
EOF

# ============================================
# STAGE 2: BUILD RUNTIME
# ============================================
# Set hash to pull exact image
FROM ${PHP_IMAGE}

# Set variables for build
ARG PHP_USER
ARG PHP_UID
ARG MAGENTO_ROOT_PATH
ARG MAGENTO_UID
ARG BRAND

# Copy user home
COPY --from=builder ${MAGENTO_ROOT_PATH} ${MAGENTO_ROOT_PATH}

# Copy all compiled extensions to final image
COPY --from=builder ${PHP_PREFIX}/lib/php/extensions/ ${PHP_PREFIX}/lib/php/extensions/

# Copy ini with all compiled extensions
COPY --from=builder ${PHP_INI_DIR}/conf.d/ ${PHP_INI_DIR}/conf.d/

# Copy timezone
COPY --from=builder /etc/timezone /etc/timezone
COPY --from=builder /tmp/localtime /etc/localtime

# Copy required libs
COPY --from=builder /tmp/runtime-libs/ /usr/lib/x86_64-linux-gnu/

# Copy n98-magerun2 tool
COPY --from=builder /usr/local/bin/n98-magerun2 /usr/local/bin/n98-magerun2

# Copy composer tool | 2.9 | Apr 17, 2026 at 8:13 pm
COPY --from=composer:2.9@sha256:dc292c5c0f95f526b051d4c341bf08e7e2b18504c74625e3203d7f123050e318 /usr/bin/composer /usr/local/bin/composer

# Copy entrypoint
COPY --chmod=755 --from=builder /entrypoint.sh /entrypoint.sh

# Lets use busybox | Mar 24, 2026 at 8:59 pm
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/busybox /bin/busybox
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/sh /bin/sh
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/ls /bin/ls
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/cat /bin/cat
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/echo /bin/echo
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/unzip /bin/unzip
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/tar /bin/tar
COPY --from=busybox:stable-glibc@sha256:7e567dff0fbaa48cddc5f52ae5201a7f417436aa20e70c8750814692043dfa38 /bin/env /bin/env

# Configure isolated user
# /etc/passwd
COPY  --chmod=644 <<EOF /etc/passwd
${BRAND}:x:${MAGENTO_UID}:${PHP_UID}:${PHP_USER}:/home/${BRAND}:/bin/false
nobody:x:65534:65534:nobody:/nonexistent:/bin/false
EOF

# /etc/group
COPY  --chmod=644 <<EOF /etc/group
${PHP_USER}:x:${PHP_UID}:
shadow:x:42:
nobody:x:65534:
EOF

# /etc/shadow
COPY  --chmod=600 <<EOF /etc/shadow
${BRAND}:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF

# end runtime build
