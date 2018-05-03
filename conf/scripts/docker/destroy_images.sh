#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

eval "$DIR/destroy_containers.sh"

## delete images
docker rmi -f "$ELASTICSEARCH_CONTAINER_NAME" || true
docker rmi -f "$VIRTUOSO_CONTAINER_NAME" || true
docker rmi -f "$MYSQL_CONTAINER_NAME" || true
docker rmi -f "$MONGODB_CONTAINER_NAME" || true
