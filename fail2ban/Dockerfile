# syntax = docker/dockerfile:labs

ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

RUN <<EOF
  apk update
  apk add --no-cache fail2ban
EOF

COPY config/ /etc/fail2ban/ 
