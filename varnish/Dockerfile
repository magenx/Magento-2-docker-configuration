# syntax = docker/dockerfile:labs
FROM varnish:6.6.1-alpine

LABEL org.opencontainers.image.authors="admin@magenx.com"
LABEL org.opencontainers.image.source="https://github.com/magenx/Magento-2-docker-configuration"

ARG TIMEZONE

RUN <<EOF
    apk update
    apk add --update --no-cache uuidgen
EOF

COPY default.vcl /etc/varnish/

RUN ln -snf /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && echo ${TIMEZONE} > /etc/timezone

RUN uuidgen > /etc/varnish/secret

RUN <<EOF cat > /usr/local/bin/docker-varnish-entrypoint
#!/bin/sh
    exec varnishd \
            -F \
            -a varnish:8081 \
            -T varnish:6082 \
            -f /etc/varnish/default.vcl \
            -S /etc/varnish/secret \
            -s malloc,1G
            -p thread_pool_min=200 \
            -p thread_pool_max=4000 \
            -p thread_pool_add_delay=2 \
            -p cli_timeout=25 \
            -p syslog_cli_traffic=off \
            -p feature=+esi_ignore_https \
            -p feature=+esi_disable_xml_check \
            -p feature=+esi_ignore_other_elements \
            -p vcc_allow_inline_c=on \
            -p http_resp_hdr_len=65536 \
            -p timeout_linger=100
EOF

