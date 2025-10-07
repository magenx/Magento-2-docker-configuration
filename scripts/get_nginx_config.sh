#!/bin/bash

. .env

cd nginx/

# fetch only magento2 configs
git init
git remote add origin https://github.com/magenx/Magento-nginx-config
git sparse-checkout set --no-cone "magento2/*"
git pull origin master

# copy all files into templates with .template suffix
find magento2 -type f | while read -r f; do
  relpath="${f#magento2/}"
  outpath="templates/${relpath}.template"
  mkdir -p "$(dirname "${outpath}")"
  cp "${f}" "${outpath}"
done