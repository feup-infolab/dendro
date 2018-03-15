#!/usr/bin/env bash

if [ "$1" == "" ]
then
    DATE=`date '+%Y-%m-%d %H:%M:%S'`
    CHECKPOINT_NAME=$DATE
else
    CHECKPOINT_NAME="$1"
fi

echo "Restoring checkpoint $CHECKPOINT_NAME..."

DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
CHECKPOINT_FOLDER="$(pwd)/data/$CHECKPOINT_NAME"
RUNNING_FOLDER="$(pwd)/data/current"

##create a checkpoint of the current state
#CHECKPOINT_OF_CURRENT_STATE=$(eval "$DOCKER_SCRIPTS_DIR/create_checkpoint.sh $(uuidgen)")
#
#echo "Saved current state as checkpoint $CHECKPOINT_OF_CURRENT_STATE."

##stop all containers
eval "$DOCKER_SCRIPTS_DIR/stop_containers.sh"

#switch volume folders
rm -rf $RUNNING_FOLDER
mkdir -p $RUNNING_FOLDER
cp -R $CHECKPOINT_FOLDER/* $RUNNING_FOLDER

eval "$DOCKER_SCRIPTS_DIR/start_containers.sh"

#wait for mysql and all the others to start up...
#sleep 20

echo "$CHECKPOINT_OF_CURRENT_STATE"

