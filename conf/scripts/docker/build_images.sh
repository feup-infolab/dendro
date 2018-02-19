#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"
TEMP_FOLDER="$(pwd)/temp"

# Build images

CACHEBUST1=$(date +%s)
CACHEBUST2=$(date +%s)
CACHEBUST3=$(date +%s)
RUNNING_FOLDER=$(pwd)/data/current

#docker build \
#    --build-arg CACHEBUST1=$CACHEBUST1\
#    --build-arg CACHEBUST1=$CACHEBUST2\
#    --build-arg CACHEBUST1=$CACHEBUST3 \
#    -t virtuoso:7.2.4-dendro \
#    "$DOCKERFILES_DIR/virtuoso_with_criu_and_ontologies"

#docker build \
#    -t elasticsearch:5.6.6-dendro \
#    "$DOCKERFILES_DIR/elasticsearch_with_criu"
#
#docker build \
#    -t mysql:8.0.3-dendro \
#    "$DOCKERFILES_DIR/mysql_with_criu"
#
#docker build \
#    -t mongo:3.4.10-dendro \
#    "$DOCKERFILES_DIR/mongo_with_criu"
#
#docker build -t redis:3.2.11-dendro \
#    "$DOCKERFILES_DIR/redis_with_criu"
#
