# syntax = docker/dockerfile:labs

ARG VARNISH_IMAGE
ARG VARNISH_DEV_IMAGE

FROM ${VARNISH_DEV_IMAGE} AS build
USER root

ARG TIMEZONE

RUN <<EOF
  cp /usr/share/zoneinfo/${TIMEZONE} /tmp/localtime
  echo ${TIMEZONE} > /etc/timezone
  cat /proc/sys/kernel/random/uuid > /etc/varnish/secret
EOF

FROM ${VARNISH_IMAGE}

COPY --chmod=644 config/ /etc/varnish/
COPY --chown=65532:65532 --chmod=600 --from=build /etc/varnish/secret /etc/varnish/secret
COPY --from=build /etc/timezone  /etc/timezone
COPY --from=build /tmp/localtime /etc/localtime
