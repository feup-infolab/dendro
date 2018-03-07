#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"


echo "Cleaning all images..."
#destroy all images
eval $DOCKER_SCRIPTS_DIR/destroy_images.sh

echo "Removing all data..."
#remove all data
#docker system prune -a -f
docker system prune -f  1> /dev/null
rm -rf data/current

echo "Creating new blank folders..."
# create data directories to mount data folders in containers
mkdir -p data/current/virtuoso
mkdir -p data/current/elasticsearch
mkdir -p data/current/mysql
mkdir -p data/current/mongo
#mkdir -p data/current/redis-default
#mkdir -p data/current/redis-social
#mkdir -p data/current/redis-notifications

# Build images again
# eval "$DOCKER_SCRIPTS_DIR/build_images.sh"

function wait_for_virtuoso_to_boot()
{
    echo "Waiting for virtuoso to boot up..."
    attempts=0
    max_attempts=30
    while ( nc 127.0.0.1 8890 < /dev/null || nc 127.0.0.1 1111 < /dev/null )  && [[ $attempts < $max_attempts ]] ; do
        attempts=$((attempts+1))
        sleep 1;
        echo "waiting... (${attempts}/${max_attempts})"
    done
}

#start new containers
echo "Starting freshly created containers..."
eval "$DOCKER_SCRIPTS_DIR/start_containers.sh"
wait_for_virtuoso_to_boot


#load ontologies into virtuoso container
echo "Setting up virtuoso..."
docker exec virtuoso-dendro /bin/bash -c "git clone https://github.com/feup-infolab/dendro-install \$HOME/dendro-install"  1> /dev/null

sleep 30

docker exec virtuoso-dendro /bin/bash -c "isql-v -U dba -P dba < \$HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql && \
                                          echo \"shutdown();\" | isql-v -U dba -P dba" 1> /dev/null

# echo "Commiting virtuoso state..."
# docker commit virtuoso-dendro virtuoso:7.2.4-dendro-ontologies-loaded 1> /dev/null

echo "Restarting virtuoso container..."
docker restart virtuoso-dendro 1> /dev/null
wait_for_virtuoso_to_boot

