#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

echo "Running stop containers script..."

function stop_container_if_running
{
    local container_name=$1
    echo "Received request to stop container $container_name"

    # container exists
    if [[ ! $(docker ps -q -f name="$container_name") ]]
    then
        if [[ ! $(docker inspect -f "{{.State.Running}}" $container_name) ]]
        then
            echo "Stopping ${container_name}"
            docker stop "$container_name"
        else
            echo "Container $container_name is not running. "
        fi
    else
        echo "Container $container_name does not exist. "
    fi
}

## stop all containers
echo "Flushing all data to disk on Virtuso server.."
docker exec virtuoso-dendro /bin/bash -c "sync && /usr/local/virtuoso-opensource/bin/isql-v 1111 -U dba -P dba 'EXEC=shutdown();'"
echo "Flushed all data to disk on Virtuso server."

stop_container_if_running "$ELASTICSEARCH_CONTAINER_NAME"
stop_container_if_running "$VIRTUOSO_CONTAINER_NAME"
stop_container_if_running "$MYSQL_CONTAINER_NAME"
stop_container_if_running "$MONGODB_CONTAINER_NAME"

echo "Stopped all containers."

