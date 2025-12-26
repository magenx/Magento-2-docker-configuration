# syntax = docker/dockerfile:labs
# ============================================
# STAGE 1: BUILD USING BASE IMAGE
# ============================================
# Set variables for build
ARG PHP_USER
ARG ROOT_PATH
ARG BRAND
ARG SUPERCRONIC

# Set hash to pull exact image
ARG ${BRAND}
ARG PHP_DEV_IMAGE
FROM ${PHP_DEV_IMAGE} AS builder

# Set variables for build
ARG PHP_USER
ARG ROOT_PATH
ARG BRAND
ARG CURRENT_SYMLINK

ARG SUPERCRONIC
ARG SUPERCRONIC_SHA1SUM
ARG SUPERCRONIC_URL

COPY config/zz-override.ini /tmp/

RUN <<EOF
  # Copy php ini options override
  envsubst < /tmp/zz-override.ini >  ${PHP_INI_DIR}/conf.d/zz-override.ini
  # Download supercronic
  curl -fsSLO "${SUPERCRONIC_URL}"
  echo "${SUPERCRONIC_SHA1SUM}  ${SUPERCRONIC}" | sha1sum -c -
  chmod +x "${SUPERCRONIC}"
  # Create crontab jobs
  mkdir -p ${ROOT_PATH}/crontabs/
  echo "* * * * * umask 007; ${ROOT_PATH}/${CURRENT_SYMLINK}/bin/magento cron:run 2>&1" > ${ROOT_PATH}/crontabs/${PHP_USER}
EOF

# ============================================
# STAGE 2: BUILD RUNTIME
# ============================================
# Set hash to pull exact image
ARG {BRAND}
FROM {BRAND}-php

# Set variables for build
ARG SUPERCRONIC
ARG PHP_USER
ARG ROOT_PATH

# Copy php ini options override
COPY --from=builder ${PHP_INI_DIR}/conf.d/zz-override.ini ${PHP_INI_DIR}/conf.d/zz-override.ini

# Copy supercronic
COPY --from=builder ${SUPERCRONIC} /usr/local/bin/supercronic

# Copy crontabs
COPY --from=builder ${ROOT_PATH}/crontab/${PHP_USER} ${ROOT_PATH}/crontabs/${PHP_USER}

