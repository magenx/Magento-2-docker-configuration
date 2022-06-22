#!/bin/bash

curl -fsSL https://get.docker.com -o get-docker.sh
bash get-docker.sh

mkdir -p ~/.docker/cli-plugins/  
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
-o ~/.docker/cli-plugins/docker-compose  
chmod +x ~/.docker/cli-plugins/docker-compose

echo "alias doco='docker compose'" >> ~/.bash_profile
. ~/.bash_profile

bash passgen.sh

echo '{ "features": { "buildkit": true } }' > /etc/docker/daemon.json
