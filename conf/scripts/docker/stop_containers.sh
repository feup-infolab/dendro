#!/usr/bin/env bash

echo "Running stop containers script..."

function stop_container_if_running
{
    container_name=$1
    echo "Received request to stop container $container_name"
    running=$(docker inspect -f "{{.State.Running}}" "$container_name")
    if [[ "$running" == "true" ]]
    then
        echo "Stopping $(docker stop $container_name)"
    else
        echo "Container $container_name is not running."
    fi
}

## stop all containers
echo "Flushing all data to disk on Virtuso server.."
docker exec virtuoso-dendro /bin/bash -c "/usr/local/virtuoso-opensource/bin/isql-v 1111 -U dba -P dba 'EXEC=shutdown();'"
echo "Flushed all data to disk on Virtuso server."
stop_container_if_running "virtuoso-dendro"
stop_container_if_running "elasticsearch-dendro"
stop_container_if_running "mysql-dendro"
stop_container_if_running "mongo-dendro"

#docker stop redis-dendro-default
#docker stop redis-dendro-social
#docker stop redis-dendro-notifications

echo "Stopped all containers."

#TRASH
#docker exec -it "virtuoso-dendro" "/usr/local
#/virtuoso-opensource/bin/isql-v < echo 'EXEC=checkpoint; shutdown;' && echo "Flushed all data to disk" || echo "Error flushing all data to disk!" && exit 1
