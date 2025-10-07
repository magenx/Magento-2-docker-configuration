# syntax = docker/dockerfile:labs

FROM xhgui/xhgui:latest

ARG UID=8142
ARG GID=8142
ARG PORT=8142

RUN <<EOF
  deluser www-data
  addgroup -g $GID www-data
  adduser -u $UID -G www-data -D -S www-data
  chown -R www-data:www-data /var/www
EOF

COPY ./nginx.conf /etc/nginx/nginx.conf
