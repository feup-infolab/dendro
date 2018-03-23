#!/usr/bin/env bash

# Start containers

RUNNING_FOLDER=$(pwd)/data/current
rm -rf RUNNING_FOLDER

# create data directories to mount data folders in containers
mkdir -p $RUNNING_FOLDER/virtuoso
mkdir -p $RUNNING_FOLDER/elasticsearch
mkdir -p $RUNNING_FOLDER/mysql
mkdir -p $RUNNING_FOLDER/mongo
#mkdir -p $RUNNING_FOLDER/redis-default
#mkdir -p $RUNNING_FOLDER/redis-social
#mkdir -p $RUNNING_FOLDER/redis-notifications

# start containers with the volumes mounted

function wait_for_server_to_boot_on_port()
{
    local port=$1
    local attempts=0
    local max_attempts=60

    echo "Waiting for server on port $port to boot up..."

    while nc 127.0.0.1 "$port" < /dev/null > /dev/null && [[ $attempts < $max_attempts ]]  ; do
        attempts=$((attempts+1))
        sleep 1;
        echo "waiting... (${attempts}/${max_attempts})"
    done

    if (( $attempts == $max_attempts ));
    then
        echo "Server on port $port failed to start after $max_attempts"
    elif (( $attempts < $max_attempts ));
    then
        echo "Server on port $port started successfully at attempt (${attempts}/${max_attempts})"
    fi
}

function container_running
{
    container_name=$1
    running=$(docker inspect -f "{{.State.Running}}" "$container_name")
    if [[ "$running" == "true" ]]
    then
        echo "Container $container_name is running."
        return 1
    else
        echo "Container $container_name not running."
        return 0
    fi
}

if container_running "elasticsearch-dendro" == 0
then
    ( docker start elasticsearch-dendro 1> /dev/null || \
    docker pull docker.elastic.co/elasticsearch/elasticsearch:6.2.2 && \
    docker run --name elasticsearch-dendro \
        -p 9200:9200 \
        -p 9300:9300 \
        -e "discovery.type=single-node" \
        -e "http.host=0.0.0.0" \
        -e "transport.host=127.0.0.1" \
        -v "$RUNNING_FOLDER/elasticsearch:/usr/share/elasticsearch/data" \
        -d docker.elastic.co/elasticsearch/elasticsearch:6.2.2 ) && \
        echo "Container elasticsearch-dendro started."
fi

wait_for_server_to_boot_on_port 9200
wait_for_server_to_boot_on_port 9300

if container_running "virtuoso-dendro" == 0
then
    ( docker start virtuoso-dendro 1> /dev/null || \
    docker run --name virtuoso-dendro \
        -p 8890:8890 \
        -p 1111:1111 \
        -e SPARQL_UPDATE=true \
        -e "VIRT_Parameters_CheckpointSyncMode=2" \
        -e "VIRT_Parameters_PageMapCheck=1" \
        -e "VIRT_Parameters_CheckpointInterval=0" \
        -v "$RUNNING_FOLDER/virtuoso:/data" \
        -d tenforce/virtuoso:1.3.1-virtuoso7.2.4 ) && \
        echo "Container virtuoso-dendro started."
fi

# -e "VIRT_Parameters_NumberOfBuffers=$((32*85000))" \

wait_for_server_to_boot_on_port 8890
wait_for_server_to_boot_on_port 1111

if container_running "mysql-dendro" == 0
then
    ( docker start mysql-dendro 1> /dev/null || \
    docker run --name mysql-dendro \
      -p 3306:3306 \
      -e MYSQL_ROOT_PASSWORD=r00t \
      -v "$RUNNING_FOLDER/mysql:/var/lib/mysql" \
      -d mysql:8.0.3 || docker start mysql-dendro 1> /dev/null ) && \
      echo "Container mysql-dendro started."
fi

wait_for_server_to_boot_on_port 3306

if container_running "mongo-dendro" == 0
then
    ( docker start mongo-dendro 1> /dev/null || \
    docker run --name mongo-dendro \
        -p 27017:27017 \
        -v "$RUNNING_FOLDER/mongo:/data/db" \
        -d mongo:3.4.10 ) && \
    echo "Container mongo-dendro started."
fi

wait_for_server_to_boot_on_port 27017

#docker run --name redis-dendro-default \
#    -p 6781:6780 \
#    -v "$RUNNING_FOLDER/redis-default:/data" \
#    -d redis:3.2.11 || docker start redis-dendro-default || docker restart redis-dendro-default
#
#docker run --name redis-dendro-social \
#    -p 6782:6780 \
#    -v "$RUNNING_FOLDER/redis-default:/data" \
#    -d redis:3.2.11 || docker start redis-dendro-social || docker restart redis-dendro-social
#
#docker run --name redis-dendro-notifications \
#    -p 6783:6780 \
#    -v "$RUNNING_FOLDER/redis-default:/data" \
#    -d redis:3.2.11 || docker start redis-dendro-notifications || docker restartredis-dendro-notifications

#docker ps


#docker run --name virtuoso-dendro \
#    -p 8890:8890 \
#    -p 1111:1111 \
#    -e SPARQL_UPDATE=true \
#    -v $RUNNING_FOLDER/virtuoso:/data \
#    -d joaorosilva/virtuoso-7.2.2-dendro || docker start virtuoso-dendro-remote

#for elasticsearch
#-Des.network.host=0.0.0.0
