# syntax = docker/dockerfile:labs

ARG NGINX_IMAGE
ARG NGINX_DEV_IMAGE
FROM ${NGINX_DEV_IMAGE} AS builder

ARG BRAND
ARG DOMAIN
ARG PHP_USER
ARG PHP_FPM
ARG TIMEZONE
ARG PROFILER
ARG RESOLVER
ARG MAGENTO_ROOT_PATH
ARG ADMIN_PATH
ARG RABBITMQ_PATH
ARG ADMINER_PATH
ARG CURRENT_SYMLINK

# Install build essential
RUN <<EOF
  apt-get update
  apt-get install -y --no-install-recommends \
  build-essential gzip git wget libzstd-dev libpcre2-dev zlib1g-dev
  rm -rf /var/lib/apt/lists/*
EOF

# Build workdir
WORKDIR /build

# Download nginx version and build module
RUN <<EOF
  set -e
  wget https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz
  ls -ltra
  tar -xzf nginx-${NGINX_VERSION}.tar.gz
  
  git clone --no-checkout https://github.com/myguard-labs/nginx-zstd-module.git
  cd nginx-zstd-module
  git checkout e76020af03f8de500695719344e00309b2e04fc7
  
  cd /build/nginx-${NGINX_VERSION}
  ./configure --with-compat --add-dynamic-module=/build/nginx-zstd-module
  make -j"$(nproc)" modules
EOF

# Copy modules
RUN <<EOF
  set -e
  ls -la /build/nginx-${NGINX_VERSION}/objs/*.so
  ldd /build/nginx-${NGINX_VERSION}/objs/ngx_http_zstd_filter_module.so
  mkdir -p /out/modules /out/lib
  cp /build/nginx-${NGINX_VERSION}/objs/ngx_http_zstd_filter_module.so /out/modules/
  cp -a /usr/lib/x86_64-linux-gnu/*zstd* /out/lib/
EOF

# Build nginx configurations
COPY ./templates /tmp/templates
RUN <<EOF
  set -e
  mkdir -p ${MAGENTO_ROOT_PATH}
  ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

  export MAGENTO_ROOT_PATH="${MAGENTO_ROOT_PATH}/${CURRENT_SYMLINK}"
  find /tmp/templates -name "*.template" -type f | while read template; do
    relative_path="${template#/tmp/templates/}";
    target_file="/etc/nginx/${relative_path%.template}";
    target_dir=$(dirname "$target_file");
    mkdir -p "$target_dir";
    envsubst '${BRAND} ${DOMAIN} ${PHP_USER} ${PHP_FPM} ${TIMEZONE} ${PROFILER} ${RESOLVER} ${MAGENTO_ROOT_PATH} ${ADMIN_PATH} ${RABBITMQ_PATH} ${ADMINER_PATH}' \
    < "$template" > "$target_file";
    echo "Processed: $template -> $target_file";
  done
  
  ln -snf /etc/nginx/sites-available/magento2.conf /etc/nginx/sites-enabled/magento2.conf
  ln -snf /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf
  
  rm -rf /tmp/templates

  sed -i 's,\(/var\)\{0\,1\}/run/nginx.pid,/tmp/nginx.pid,' /etc/nginx/nginx.conf
  sed -i '/user  nginx;/d' /etc/nginx/nginx.conf
EOF


# Final runtime
FROM ${NGINX_IMAGE}
# Copy all libs and configurations
COPY --from=builder /out/modules/ /usr/lib/nginx/modules/
COPY --from=builder /out/lib/ /usr/lib/x86_64-linux-gnu/
COPY --from=builder /etc/nginx /etc/nginx
