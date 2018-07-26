#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

eval "$DIR/stop_containers.sh"

## delete containers
docker rm -f "$ELASTICSEARCH_CONTAINER_NAME" || true
docker rm -f "$VIRTUOSO_CONTAINER_NAME" || true
docker rm -f "$MYSQL_CONTAINER_NAME" || true
docker rm -f "$MONGODB_CONTAINER_NAME" || true
docker rm -f "$FUSEKI_CONTAINER_NAME" || true

