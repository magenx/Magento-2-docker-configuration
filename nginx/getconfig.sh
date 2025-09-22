#!/bin/bash
git init
git config core.sparseCheckout true
echo "magento2/*" >> .git/info/sparse-checkout
git remote add origin https://github.com/magenx/Magento-nginx-config
git pull origin master