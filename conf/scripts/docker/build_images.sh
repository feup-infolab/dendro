#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"

# create data directories to mount data folders in containers
mkdir -p data/virtuoso
mkdir -p data/elasticsearch
mkdir -p data/mysql
mkdir -p data/mongo
mkdir -p data/redis-default
mkdir -p data/redis-social
mkdir -p data/redis-notifications

# Build images

docker build \
    -t virtuoso:7.2.2-dendro-v0.3 \
    "$DOCKER_SCRIPTS_DIR/dockerfiles/virtuoso_with_criu_and_ontologies"

docker build \
    -t elasticsearch:2.3.3-dendro-v0.3 \
    "$DOCKER_SCRIPTS_DIR/dockerfiles/elasticsearch_with_criu"

docker build \
    -t mysql:8.0.3-dendro-v0.3 \
    "$DOCKER_SCRIPTS_DIR/dockerfiles/mysql_with_criu"

docker build \
    -t mongo:3.4.10-dendro-v0.3 \
    "$DOCKER_SCRIPTS_DIR/dockerfiles/mongo_with_criu"

docker build -t redis:3.2.11-dendro-v0.3 \
    "$DOCKER_SCRIPTS_DIR/dockerfiles/redis_with_criu"

