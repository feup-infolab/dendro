#!/usr/bin/env bash

DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"
CHECKPOINT_NAME=$(uuidgen)
CHECKPOINT_FOLDER=$(pwd)/data/$CHECKPOINT_NAME
RUNNING_FOLDER=$(pwd)/data/current


rm -rf $CHECKPOINT_FOLDER

##stop all containers
#
docker pause virtuoso-dendro
docker pause elasticsearch-dendro
docker pause virtuoso-dendro
docker pause mysql-dendro
docker pause mongo-dendro
docker pause redis-dendro-default
docker pause redis-dendro-social
docker pause redis-dendro-notifications

# create copy of folder
cp -R $RUNNING_FOLDER $CHECKPOINT_FOLDER

## start containers with the volumes mounted
docker unpause virtuoso-dendro
docker unpause elasticsearch-dendro
docker unpause virtuoso-dendro
docker unpause mysql-dendro
docker unpause mongo-dendro
docker unpause redis-dendro-default
docker unpause redis-dendro-social
docker unpause redis-dendro-notifications

echo "$CHECKPOINT_NAME"