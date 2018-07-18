#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

CHECKPOINT_NAME="$1"

echo "Running checkpoint create script for $CHECKPOINT_NAME..."

docker commit -p "$ELASTICSEARCH_CONTAINER_NAME" "$ELASTICSEARCH_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

# docker exec "$VIRTUOSO_CONTAINER_NAME" /bin/bash -c "sync && /usr/local/virtuoso-opensource/bin/isql-v 1111 -U dba -P dba 'EXEC=checkpoint; shutdown;'"
docker exec "$VIRTUOSO_CONTAINER_NAME" /bin/bash -c "/usr/local/virtuoso-opensource/bin/isql-v 1111 -U dba -P dba 'EXEC=checkpoint;' && sync"
docker commit -p "$VIRTUOSO_CONTAINER_NAME" "$VIRTUOSO_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"
# docker start "$VIRTUOSO_CONTAINER_NAME"


docker commit -p "$MYSQL_CONTAINER_NAME" "$MYSQL_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

# Commit pending operations to hard drive and commit
docker exec "$MONGODB_CONTAINER_NAME" /bin/bash -c "mongo --eval \"db.adminCommand( { fsync: 1, async: true } )\" && sync"
docker commit -p "$MONGODB_CONTAINER_NAME" "$MONGODB_CONTAINER_NAME:dendro-tests_$CHECKPOINT_NAME"

echo "Checkpoint create script for checkpoint $CHECKPOINT_NAME finished."
