#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

CHECKPOINT_NAME="$1"

echo "Restoring checkpoint $CHECKPOINT_NAME..."

docker commit "$ELASTICSEARCH_CONTAINER_NAME" "$ELASTICSEARCH_CONTAINER_NAME:$CHECKPOINT_NAME"
docker commit "$VIRTUOSO_CONTAINER_NAME" "$VIRTUOSO_CONTAINER_NAME:$CHECKPOINT_NAME"
docker commit "$MYSQL_CONTAINER_NAME" "$MYSQL_CONTAINER_NAME:$CHECKPOINT_NAME"
docker commit "$MONGODB_CONTAINER_NAME" "$MONGODB_CONTAINER_NAME:$CHECKPOINT_NAME"

echo "Restored checkpoint $CHECKPOINT_NAME successfully."


