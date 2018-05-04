#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

CHECKPOINT_NAME="$1"

eval ./stop_containers.sh

echo "Restoring checkpoint $CHECKPOINT_NAME..."

docker run --name "$ELASTICSEARCH_CONTAINER_NAME" -d "$ELASTICSEARCH_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"
docker run --name "$VIRTUOSO_CONTAINER_NAME" -d "$VIRTUOSO_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"
docker run --name "$MYSQL_CONTAINER_NAME" -d "$MYSQL_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"
docker run --name "$MONGODB_CONTAINER_NAME" -d "$MONGODB_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

echo "Restored checkpoint $CHECKPOINT_NAME successfully."


