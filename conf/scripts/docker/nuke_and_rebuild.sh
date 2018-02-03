#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"

#destroy all images
eval $DOCKER_SCRIPTS_DIR/destroy_images.sh

#remove all data
#docker system prune -a -f
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
# eval "$DOCKER_SCRIPTS_DIR/build_images.sh"

#start new containers
eval "$DOCKER_SCRIPTS_DIR/start_containers.sh"

#load ontologies into virtuoso container
docker run --name virtuoso-dendro -p 8890:8890 -p 1111:1111 -e SPARQL_UPDATE=true -d virtuoso:7.2.4-dendro-v0.3
docker exec virtuoso-dendro /bin/bash -c "git clone https://github.com/feup-infolab/dendro-install \$HOME/dendro-install" &
sleep 15 &
wait

docker exec virtuoso-dendro /bin/bash -c "isql-v -U dba -P dba < \$HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql && \
                                          echo \"shutdown();\" | isql-v -U dba -P dba"
docker commit virtuoso-dendro virtuoso:7.2.4-dendro-v0.3-ontologies-loaded
docker restart virtuoso-dendro
