# syntax = docker/dockerfile:labs
ARG NODE_VERSION
FROM node:${NODE_VERSION}-alpine

LABEL author="admin@magenx.com"
LABEL source="https://github.com/magenx/Magento-2-docker-configuration"

ARG BRAND
ARG PHP_USER
ARG ROOT_PATH

#RUN addgroup -S -g 1001 ${PHP_USER} && \
#    adduser -S -H -h ${ROOT_PATH} -u 1001 -G ${PHP_USER} ${PHP_USER} && \
#    addgroup -S -g 1000 ${BRAND} && \
#    adduser -S -H -h ${ROOT_PATH} -u 1000 -G ${PHP_USER} ${BRAND}

ENV NODE_ENV=production

RUN npm install -g grunt-cli

#USER ${BRAND}

