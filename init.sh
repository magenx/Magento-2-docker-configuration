#!/bin/bash

export DEBIAN_FRONTEND=noninteractive 
apt update && apt upgrade -y
apt-get -y install ca-certificates software-properties-common screen ipset vim strace rsyslog git apache2-utils

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
  
apt-get update
apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "alias for docker compose command = [ doco ]"
echo "alias doco='docker compose'" >> ~/.bash_profile
source ~/.bash_profile

mkdir /opt/magento
cd /opt/magento

git clone https://github.com/magenx/Magento-2-docker-configuration.git .

mv .env.template .env
vim .env

echo "generating random passwords ..."
bash passgen.sh

cd /opt/magento
