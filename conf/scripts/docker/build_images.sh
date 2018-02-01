#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"

# Build images

CACHEBUST1=$(date +%s)
CACHEBUST2=$(date +%s)
CACHEBUST3=$(date +%s)
RUNNING_FOLDER=$(pwd)/data/current

docker build \
    --build-arg CACHEBUST1=$CACHEBUST1\
    --build-arg CACHEBUST1=$CACHEBUST2\
    --build-arg CACHEBUST1=$CACHEBUST3 \
    -t virtuoso:7.2.2-dendro-v0.3 \
    "$DOCKERFILES_DIR/virtuoso_with_criu_and_ontologies"

#LOAD ONTOLOGIES BECAUSE EITHER I OR THE THE DOCKERFILE ARE TOO STUPID TO DO THAT EFFECTIVELY, THANK YOU DOCKER
mkdir -p $RUNNING_FOLDER/virtuoso
docker run --name virtuoso-dendro \
    -p 8890:8890 \
    -p 1111:1111 \
    -e SPARQL_UPDATE=true \
    -v $RUNNING_FOLDER/virtuoso:/data \
    -d virtuoso:7.2.2-dendro-v0.3 || docker start virtuoso-dendro

sleep 30
docker exec virtuoso-dendro /bin/bash -c "isql-v -U dba -P dba < \$HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql"
docker stop virtuoso-dendro

#####

docker build \
    -t elasticsearch:2.3.3-dendro-v0.3 \
    "$DOCKERFILES_DIR/elasticsearch_with_criu"

docker build \
    -t mysql:8.0.3-dendro-v0.3 \
    "$DOCKERFILES_DIR/mysql_with_criu"

docker build \
    -t mongo:3.4.10-dendro-v0.3 \
    "$DOCKERFILES_DIR/mongo_with_criu"

docker build -t redis:3.2.11-dendro-v0.3 \
    "$DOCKERFILES_DIR/redis_with_criu"

