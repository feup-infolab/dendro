#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

CHECKPOINT_NAME="$1"

echo "Restoring checkpoint $CHECKPOINT_NAME..."

docker stop "$ELASTICSEARCH_CONTAINER_NAME"
docker rm "$ELASTICSEARCH_CONTAINER_NAME"
docker run \
          -p 9200:9200 \
          -p 9300:9300 \
          -e "discovery.type=single-node" \
          -e "http.host=0.0.0.0" \
          -e "transport.host=${ELASTICSEARCH_HOSTNAME}" \
          --name "$ELASTICSEARCH_CONTAINER_NAME" \
          --hostname="$ELASTICSEARCH_HOSTNAME" \
          -d "$ELASTICSEARCH_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

docker stop "$VIRTUOSO_CONTAINER_NAME"
docker rm "$VIRTUOSO_CONTAINER_NAME"
docker run \
          -p 8890:8890 \
          -p 1111:1111 \
          -e SPARQL_UPDATE=true \
          -e "VIRT_Parameters_CheckpointSyncMode=2" \
          -e "VIRT_Parameters_PageMapCheck=1" \
          -e "VIRT_Parameters_CheckpointInterval=0" \
          --name="$VIRTUOSO_CONTAINER_NAME" \
          --hostname="$VIRTUOSO_HOSTNAME" \
          -d "$VIRTUOSO_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

docker stop "$MYSQL_CONTAINER_NAME"
docker rm "$MYSQL_CONTAINER_NAME"
docker run \
        -p 3306:3306 \
        -e MYSQL_ROOT_PASSWORD=r00t \
        --name="$MYSQL_CONTAINER_NAME" \
        --hostname="$MYSQL_HOSTNAME" \
        --name "$MYSQL_CONTAINER_NAME" \
        -d "$MYSQL_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

docker stop "$MONGODB_CONTAINER_NAME"
docker rm "$MONGODB_CONTAINER_NAME"
docker run \
          -p 27017:27017 \
          --name="$MONGODB_CONTAINER_NAME" \
          --hostname="$MONGODB_HOSTNAME" \
          --name "$MONGODB_CONTAINER_NAME" \
          -d "$MONGODB_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

echo "Restored checkpoint $CHECKPOINT_NAME successfully."


