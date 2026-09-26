# syntax = docker/dockerfile:labs

ARG RABBITMQ_IMAGE
FROM ${RABBITMQ_IMAGE}

COPY --chmod=644 config/enabled_plugins /enabled_plugins
