# syntax = docker/dockerfile:labs

ARG VARNISH_IMAGE
ARG VARNISH_DEV_IMAGE
FROM ${VARNISH_DEV_IMAGE} as build

ARG TIMEZONE
ARG VARNISH_SIZE

RUN <<EOF
  cp /usr/share/zoneinfo/${TIMEZONE} /tmp/localtime
  echo ${TIMEZONE} > /etc/timezone
  cat /proc/sys/kernel/random/uuid > /etc/varnish/secret
EOF

FROM ${VARNISH_IMAGE}

COPY --chmod=644 config/ /etc/varnish/
COPY --chmod=640 --from=build /etc/varnish/secret /etc/varnish/secret
COPY --from=build /etc/timezone  /etc/timezone
COPY --from=build /tmp/localtime  /etc/localtime
