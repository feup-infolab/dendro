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

echo "Running checkpoint create script for $CHECKPOINT_NAME..."

CHECKPOINT_FOLDER=$(pwd)/data/$CHECKPOINT_NAME
RUNNING_FOLDER=$(pwd)/data/current

rm -rf $CHECKPOINT_FOLDER

##stop all containers
echo "Stopping all containers..."
eval "$DOCKER_SCRIPTS_DIR/stop_containers.sh"

# create copy of folder
echo "Copying $RUNNING_FOLDER -> $CHECKPOINT_FOLDER"
cp -R $RUNNING_FOLDER $CHECKPOINT_FOLDER

## start containers with the volumes mounted
echo "Re-Starting all containers..."
eval "$DOCKER_SCRIPTS_DIR/start_containers.sh"

echo "Checkpoint create script for checkpoint $CHECKPOINT_NAME finished."
