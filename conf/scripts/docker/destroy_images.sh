#!/usr/bin/env bash

DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"

eval $DOCKER_SCRIPTS_DIR/destroy_containers.sh

## delete images
docker rm -f virtuoso-dendro || true
docker rm -f elasticsearch-dendro || true
docker rm -f mysql-dendro || true
docker rm -f mongo-dendro || true
docker rm -f redis-dendro-default || true
docker rm -f virtuoso-dendro || true
docker rm -f redis-dendro-social || true
docker rm -f redis-dendro-notifications || true


docker ps