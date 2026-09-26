# syntax = docker/dockerfile:labs

ARG VALKEY_IMAGE
FROM ${VALKEY_IMAGE} AS base

# ---------------------------------------------------------------------
#  RUNTIME: cache  (service cache, UID 6380) - volatile, no persistence
# ---------------------------------------------------------------------
FROM base AS cache

COPY --chmod=644 config/cache.conf /cache.conf


# ---------------------------------------------------------------------
#  RUNTIME: session  (service session, UID 6379) - RDB + AOF
# ---------------------------------------------------------------------
FROM base AS session

COPY --chmod=644 config/session.conf /session.conf

