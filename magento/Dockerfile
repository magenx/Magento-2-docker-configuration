# syntax = docker/dockerfile:labs
# ============================================
# STAGE 1: BUILD USING BASE IMAGE
# ============================================
# Set variables for build
ARG ROOT_PATH
ARG BRAND

# Set hash to pull exact image
ARG ${BRAND}
ARG PHP_DEV_IMAGE
FROM ${PHP_DEV_IMAGE} AS builder

# Set variables for build
ARG ROOT_PATH
ARG BRAND

COPY entrypoint.sh /entrypoint.sh
COPY ../php/config/zz-cli-override.ini /tmp/

RUN <<EOF
  # Copy php ini options override
  envsubst < /tmp/zz-cli-override.ini >  ${PHP_INI_DIR}/conf.d/zz-cli-override.ini
  
  # Download n98-magerun2
  curl -o /usr/local/bin/n98-magerun2 https://files.magerun.net/n98-magerun2.phar
  chmod +x /usr/local/bin/n98-magerun2
  
  # Magento entrypoint script
  chmod +x /entrypoint.sh
EOF

# ============================================
# STAGE 2: BUILD RUNTIME
# ============================================
# Set hash to pull exact image
ARG {BRAND}
FROM {BRAND}-php

# Set variables for build
ARG ROOT_PATH
ARG BRAND

# Copy php ini options override
COPY --from=builder ${PHP_INI_DIR}/conf.d/zz-cli-override.ini ${PHP_INI_DIR}/conf.d/zz-cli-override.ini

# Copy magerun tool
COPY --from=builder /usr/local/bin/n98-magerun2 /usr/local/bin/n98-magerun2

# Copy magento entrypoint
COPY --from=builder /entrypoint.sh /entrypoint.sh

# Configure isolated user
# /etc/passwd
COPY  --chmod=644 <<EOF /etc/passwd
${BRAND}:x:${MAGENTO_UID}:${MAGENTO_UID}:${BRAND}:/home/${BRAND}:/bin/false
nobody:x:65534:65534:nobody:/nonexistent:/bin/false
EOF

# /etc/group
COPY  --chmod=644 <<EOF /etc/group
${BRAND}:x:${MAGENTO_UID}:${BRAND}
shadow:x:42:
nobody:x:65534:
EOF

# /etc/shadow
COPY  --chmod=600 <<EOF /etc/shadow
${BRAND}:!::0:99999:7:::
nobody:*::0:99999:7:::
EOF

# end runtime build
