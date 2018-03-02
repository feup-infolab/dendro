#!/usr/bin/env bash

function stop_container_if_running
{
    container_name=$1
    running=$(docker inspect -f "{{.State.Running}}" "$container_name")
    if [[ "$running" == "true" ]]
    then
        echo "Stopping $(docker stop $container_name)"
    fi
}

## start containers with the volumes mounted
stop_container_if_running "virtuoso-dendro"
stop_container_if_running "elasticsearch-dendro"
stop_container_if_running "mysql-dendro"
stop_container_if_running "mongo-dendro"

#docker stop redis-dendro-default
#docker stop redis-dendro-social
#docker stop redis-dendro-notifications
