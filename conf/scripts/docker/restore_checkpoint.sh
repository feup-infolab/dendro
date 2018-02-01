#!/usr/bin/env bash

DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
CHECKPOINT_NAME=$1
CHECKPOINT_FOLDER=$(pwd)/data/$CHECKPOINT_NAME
RUNNING_FOLDER=$(pwd)/data/current

#create a checkpoint of the current state
CHECKPOINT_OF_CURRENT_STATE=$($DOCKER_SCRIPTS_DIR/create_checkpoint.sh)

##stop all containers
#
docker pause virtuoso-dendro
docker pause elasticsearch-dendro
docker pause mysql-dendro
docker pause mongo-dendro
docker pause redis-dendro-default
docker pause redis-dendro-social
docker pause redis-dendro-notifications

#switch volume folders
rm -rf $RUNNING_FOLDER
mkdir -p $RUNNING_FOLDER
cp -R $CHECKPOINT_FOLDER/* $RUNNING_FOLDER

## start containers with the volumes mounted
docker restart virtuoso-dendro
docker restart elasticsearch-dendro
docker restart mysql-dendro
docker restart mongo-dendro
docker restart redis-dendro-default
docker restart redis-dendro-social
docker restart redis-dendro-notifications

echo "$CHECKPOINT_OF_CURRENT_STATE"

