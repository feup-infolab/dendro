#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"

#destroy all images
eval $DOCKER_SCRIPTS_DIR/destroy_images.sh

#remove all data
docker system prune -f
rm -rf data/current

# create data directories to mount data folders in containers
mkdir -p data/current/virtuoso
mkdir -p data/current/elasticsearch
mkdir -p data/current/mysql
mkdir -p data/current/mongo
mkdir -p data/current/redis-default
mkdir -p data/current/redis-social
mkdir -p data/current/redis-notifications

# Build images again
eval "$DOCKER_SCRIPTS_DIR/build_images.sh"