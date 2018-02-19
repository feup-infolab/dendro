#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"

if [ "$1" == "" ]
then
    DATE=`date '+%Y-%m-%d %H:%M:%S'`
    CHECKPOINT_NAME=$DATE
else
    CHECKPOINT_NAME="$1"
fi

echo "$CHECKPOINT_NAME"

CHECKPOINT_FOLDER=$(pwd)/data/$CHECKPOINT_NAME
RUNNING_FOLDER=$(pwd)/data/current

rm -rf $CHECKPOINT_FOLDER

##stop all containers
echo "Pausing all containers..."
eval "$DOCKER_SCRIPTS_DIR/pause_containers.sh"

# create copy of folder
echo "Copying $RUNNING_FOLDER -> $CHECKPOINT_FOLDER"
cp -R $RUNNING_FOLDER $CHECKPOINT_FOLDER

## start containers with the volumes mounted
echo "UnPausing all containers..."
eval "$DOCKER_SCRIPTS_DIR/unpause_containers.sh"

echo "$CHECKPOINT_NAME done!"
