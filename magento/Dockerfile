# syntax = docker/dockerfile:labs
# ============================================
# STAGE 1: BUILD EXTENSIONS IN DEV USING SOURCE
# ============================================
# Set variables for build
ARG PHP_USER
ARG PHP_UID
ARG MAGENTO_UID
ARG ROOT_PATH
ARG BRAND
ARG PHP_IMAGE
ARG PHP_EXTENSION

# Set hash to pull exact image
ARG PHP_DEV_IMAGE
FROM ${PHP_DEV_IMAGE} AS builder

# Set variables for build
ARG PHP_EXTENSION
ARG PHP_USER
ARG ROOT_PATH
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
  gettext \
  libfreetype6 \
  libjpeg62-turbo \
  libpng16-16 \
  libwebp7 \
  libxslt1.1 \
  build-essential \
  libargon2-dev \
  libfreetype-dev \
  libjpeg-dev \
  libpng-dev \
  libwebp-dev \
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

# Configure PHP
RUN <<EOF
  mkdir -p ${ROOT_PATH}
  envsubst < /tmp/zz-cli-override.ini >  ${PHP_INI_DIR}/conf.d/zz-cli-override.ini
  
  # Download n98-magerun2
  mkdir -p /usr/local/bin/
  curl -sS -O https://files.magerun.net/n98-magerun2.phar && \
    curl -sS -o n98-magerun2.phar.sha256 https://files.magerun.net/sha256.php?file=n98-magerun2.phar && \
	shasum -a 256 -c n98-magerun2.phar.sha256 && mv n98-magerun2.phar /usr/local/bin/n98-magerun2 && \
	chmod +x /usr/local/bin/n98-magerun2 && rm n98-magerun2.phar.sha256 && \
	echo "n98 installation successful" || echo "n98 installation failed"

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
ARG ROOT_PATH
ARG MAGENTO_UID
ARG BRAND

# Copy user home
COPY --from=builder ${ROOT_PATH} ${ROOT_PATH}

# Copy all compiled extensions to final image
COPY --from=builder ${PHP_PREFIX}/lib/php/extensions/ ${PHP_PREFIX}/lib/php/extensions/

# Copy ini with all compiled extensions
COPY --from=builder ${PHP_INI_DIR}/conf.d/ ${PHP_INI_DIR}/conf.d/

# Copy timezone
COPY --from=builder /etc/timezone /etc/timezone
COPY --from=builder /tmp/localtime /etc/localtime

# Copy required libs
COPY --from=builder /tmp/runtime-libs/ /usr/lib/x86_64-linux-gnu/

# Copy magerun tool
COPY --from=builder /usr/local/bin/n98-magerun2 /usr/local/bin/n98-magerun2

# Lets use busybox
COPY --from=busybox:stable-glibc /bin/busybox /bin/busybox
COPY --from=busybox:stable-glibc /bin/sh /bin/sh
COPY --from=busybox:stable-glibc /bin/ls /bin/ls
COPY --from=busybox:stable-glibc /bin/cat /bin/cat
COPY --from=busybox:stable-glibc /bin/echo /bin/echo
COPY --from=busybox:stable-glibc /bin/unzip /bin/unzip
COPY --from=busybox:stable-glibc /bin/tar /bin/tar

# Configure isolated user
# /etc/passwd
COPY  --chmod=644 <<EOF /etc/passwd
${BRAND}:x:${MAGENTO_UID}:${PHP_UID}:${PHP_USER}:/home/${BRAND}:/bin/false
nobody:x:65534:65534:nobody:/nonexistent:/bin/false
EOF

# /etc/group
COPY  --chmod=644 <<EOF /etc/group
${PHP_USER}:x:${PHP_UID}:${PHP_USER}
shadow:x:42:
nobody:x:65534:
EOF

# /etc/shadow
COPY  --chmod=600 <<EOF /etc/shadow
${BRAND}:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF

# end runtime build
