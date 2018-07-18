#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

CHECKPOINT=$1

echo "Checking if checkpoint $CHECKPOINT exists..."

function check_for_checkpoint
{
    local IMAGE_NAME=$1
    $(docker image inspect $IMAGE_NAME:dendro-tests_$CHECKPOINT > /dev/null)
}


check_for_checkpoint "$ELASTICSEARCH_CONTAINER_NAME" && \
check_for_checkpoint "$VIRTUOSO_CONTAINER_NAME" && \
check_for_checkpoint "$MYSQL_CONTAINER_NAME" && \
check_for_checkpoint "$MONGODB_CONTAINER_NAME"
