#!/bin/bash

# Minimal Docker bootstrap script
# User Namespace Remap Setup
# Uses the 'default' setting for automatic setup
# Install docker and pulls docker compose config

set -e

# Check root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root"
    exit 1
fi

echo "Configuring /etc/docker/daemon.json"
mkdir -p /etc/docker/
cat > /etc/docker/daemon.json <<EOF
{
  "userns-remap": "default"
}
EOF

echo ""
echo "Done! User namespace remapping is now enabled with automatic default configuration."
echo "Docker automatically created the 'dockremap' user and configured /etc/subuid & /etc/subgid."
echo ""


echo "Docker installation"
export DEBIAN_FRONTEND=noninteractive 
apt update && apt upgrade -y
apt-get -y install ca-certificates software-properties-common screen ipset vim strace rsyslog git apache2-utils
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ""
echo "Update docker compose alias"
echo "alias for docker compose command = [ doco ]"
echo "alias doco='docker compose'" >> ~/.bash_profile
source ~/.bash_profile

echo ""
echo "Create /opt/magenx/docker directory"
mkdir -p /opt/magenx/docker
cd /opt/magenx/docker

echo ""
echo "Clone docker compose configuration"
git clone https://github.com/magenx/Magento-2-docker-configuration.git .

mv .env.template .env
vim .env

echo ""
echo "Generating random passwords ..."
bash passgen.sh

cd /opt/magenx/docker
