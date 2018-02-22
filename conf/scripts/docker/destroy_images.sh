#!/usr/bin/env bash

DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"

eval $DOCKER_SCRIPTS_DIR/destroy_containers.sh

## delete images
docker rmi -f virtuoso-dendro || true
docker rmi -f elasticsearch-dendro || true
docker rmi -f mysql-dendro || true
docker rmi -f mongo-dendro || true
#docker rmi -f redis-dendro-default || true
#docker rmi -f redis-dendro-social || true
#docker rmi -f redis-dendro-notifications || true

docker ps
