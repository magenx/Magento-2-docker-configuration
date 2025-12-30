# syntax = docker/dockerfile:labs
# ============================================
# STAGE 1: BUILD EXTENSIONS IN DEV USING SOURCE
# ============================================
# Set variables for build
ARG PHP_USER
ARG PHP_UID
ARG ROOT_PATH
ARG BRAND

# Set hash to pull exact image
ARG PHP_FPM_IMAGE
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
  libldap2-dev \
  libxslt1-dev \
  libzip-dev \
  libcurl4-openssl-dev \
  libgettextpo-dev \
  libicu-dev \
  libonig-dev \
  libpcre2-dev \
  libssl-dev \
  libxml2-dev \
  libffi-dev \
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
    cd ${PHP_SRC_DIR}
    echo "✅ Built $ext";
  else
    echo "⚠️ $ext not in source";
  fi;
  done
EOF


# Use PIE to install extensions
COPY --from=ghcr.io/php/pie:bin /pie /usr/local/bin/pie
RUN <<EOF
  pie install kjdev/lz4
  pie install apcu/apcu

  # Use PECL to install extensions
  pecl install oauth
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
	  echo "extension=$so_file" > ${PHP_INI_DIR}/conf.d/$(basename "${so_file%.*}").ini
  done
  # Also copy specific critical libraries
  for lib in \
      /usr/lib/x86_64-linux-gnu/libldap*.so* \
      /usr/lib/x86_64-linux-gnu/liblber*.so* \
      /usr/lib/x86_64-linux-gnu/libffi*.so* \
      /usr/lib/x86_64-linux-gnu/libgcrypt*.so* \
      /usr/lib/x86_64-linux-gnu/libgpg-error*.so* \
      /usr/lib/x86_64-linux-gnu/libbz2*.so*; do
      cp $lib /tmp/runtime-libs/ 2>/dev/null || true;
  done
EOF

# Build list all the libs
RUN <<EOF
  ls -ltr /tmp/runtime-libs
  ls -ltr ${PHP_PREFIX}/lib/php/extensions/no-debug-non-zts-*/
EOF

# Copy PHP-FPM config files
COPY config/* /tmp/
# Configure PHP
RUN <<EOF
  mkdir -p ${ROOT_PATH}
  mkdir -p ${PHP_PREFIX}/etc/php-fpm.d
  envsubst < /tmp/www.conf > ${PHP_PREFIX}/etc/php-fpm.d/www.conf
  envsubst < /tmp/php-fpm.conf > ${PHP_PREFIX}/etc/php-fpm.conf
  
  touch ${PHP_PREFIX}/etc/php-fpm.d/{zz-docker.conf,docker.conf}
  
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime
  echo ${TIMEZONE} > /etc/timezone
EOF

# ============================================
# STAGE 2: BUILD RUNTIME
# ============================================
# Set hash to pull exact image
ARG PHP_FPM_IMAGE
FROM ${PHP_FPM_IMAGE}

# Set variables for build
ARG PHP_USER
ARG PHP_UID
ARG ROOT_PATH
ARG BRAND

# Copy user home
COPY --from=builder ${ROOT_PATH} ${ROOT_PATH}

# Copy all compiled extensions to final image
COPY --from=builder ${PHP_PREFIX}/lib/php/extensions/ ${PHP_PREFIX}/lib/php/extensions/

# Copy FPM config
COPY --from=builder ${PHP_PREFIX}/etc/php-fpm.d/ ${PHP_PREFIX}/etc/php-fpm.d/
COPY --from=builder ${PHP_PREFIX}/etc/php-fpm.conf ${PHP_PREFIX}/etc/php-fpm.conf

# Copy ini with all compiled extensions
COPY --from=builder ${PHP_INI_DIR}/conf.d/ ${PHP_INI_DIR}/conf.d/

# Copy timezone
COPY --from=builder /etc/timezone /etc/timezone

# Copy required libs
COPY --from=builder /tmp/runtime-libs/ /usr/lib/x86_64-linux-gnu/

# Configure isolated user
# /etc/passwd
COPY  --chmod=644 <<EOF /etc/passwd
${PHP_USER}:x:${PHP_UID}:${PHP_UID}:${PHP_USER}:/home/${BRAND}:/bin/false
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
${PHP_USER}:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF

# end runtime build
