#!/bin/bash

. .env

# fetch only magento2 configs into a temp dir, nginx/ stays a plain folder of this repo
# so nginx/templates can be committed and edited
NGINX_CONFIG_TMP=$(mktemp -d)
trap 'rm -rf "${NGINX_CONFIG_TMP}"' EXIT

git -C "${NGINX_CONFIG_TMP}" init -q
git -C "${NGINX_CONFIG_TMP}" remote add origin https://github.com/magenx/Magento-nginx-config
git -C "${NGINX_CONFIG_TMP}" sparse-checkout set --no-cone "magento2/*"
git -C "${NGINX_CONFIG_TMP}" pull -q origin master

# copy all files into templates with .template suffix
find "${NGINX_CONFIG_TMP}/magento2" -type f | while read -r f; do
  relpath="${f#"${NGINX_CONFIG_TMP}"/magento2/}"
  outpath="nginx/templates/${relpath}.template"
  mkdir -p "$(dirname "${outpath}")"
  cp "${f}" "${outpath}"
done
