# syntax = docker/dockerfile:labs

ARG VARNISH_IMAGE
ARG VARNISH_DEV_IMAGE

FROM ${VARNISH_DEV_IMAGE} AS build
USER root

ARG TIMEZONE
ARG VMOD_DYNAMIC_BRANCH=

RUN <<EOF
  cp /usr/share/zoneinfo/${TIMEZONE} /tmp/localtime
  echo ${TIMEZONE} > /etc/timezone
  cat /proc/sys/kernel/random/uuid > /etc/varnish/secret
EOF

RUN <<EOF
  apt-get update && apt-get install -y --no-install-recommends \
  git ca-certificates autoconf automake libtool make pkg-config \
  python3 python3-docutils
EOF

RUN <<EOF
  set -eux
  export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
  export ACLOCAL_PATH=/usr/local/share/aclocal
  BRANCH="${VMOD_DYNAMIC_BRANCH:-$(varnishd -V 2>&1 | grep -oE 'varnish-[0-9]+\.[0-9]+' | cut -d- -f2)}"
  git clone --depth 1 --branch "$BRANCH" https://github.com/nigoroll/libvmod-dynamic.git /src/dynamic
  cd /src/dynamic
  ./bootstrap
  ./configure
  make -j"$(nproc)"
  VMODDIR="$(pkg-config --variable=vmoddir varnishapi)"
  mkdir -p "/out${VMODDIR}"
  cp src/.libs/libvmod_dynamic.so "/out${VMODDIR}/"
  ldd "/out${VMODDIR}/libvmod_dynamic.so"
EOF

FROM ${VARNISH_IMAGE}

COPY --chmod=644 config/ /etc/varnish/
COPY --chown=65532:65532 --chmod=600 --from=build /etc/varnish/secret /etc/varnish/secret
COPY --from=build /etc/timezone  /etc/timezone
COPY --from=build /tmp/localtime /etc/localtime
COPY --from=build /out/ /
