#!/usr/bin/env bash

# DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG
# stop and destroy all containers
# docker stop $(docker ps -aq)
# docker rm $(docker ps -aq)
# docker system prune
# DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG

# Get network for the containers
NETWORK_NAME="$1"
NETWORK_SUBNET="$2"

echo "Network Name: $NETWORK_NAME"

# adjust parameters for containers if a custom subnet is being used
if [[ "$NETWORK_NAME" != "" && "$NETWORK_SUBNET" != "" ]]
then
    # calculate IP addresses of the containers
    ELASTICSEARCH_IP="${NETWORK_SUBNET}.1"
    echo "ELASTICSEARCH_IP: $ELASTICSEARCH_IP"

    VIRTUOSO_IP="${NETWORK_SUBNET}.2"
    echo "VIRTUOSO_IP: $VIRTUOSO_IP"

    MYSQL_IP="${NETWORK_SUBNET}.3"
    echo "MYSQL_IP: $MYSQL_IP"

    MONGODB_IP="${NETWORK_SUBNET}.4"
    echo "MONGODB_IP: $MONGODB_IP"

    NETWORK_SUBNET="${NETWORK_SUBNET}.0/25" # max 255 containers on this subnet
    echo "Network Subnet: $NETWORK_SUBNET"
    echo "Creating docker subnet $NETWORK_NAME with value $NETWORK_SUBNET..."
    docker network rm "$NETWORK_NAME"
    docker network create \
      --driver=bridge \
      --subnet="$NETWORK_SUBNET" \
      "$NETWORK_NAME"

    # set running folder with network name suffix
    RUNNING_FOLDER=$(pwd)/data/$NETWORK_NAME/current

    #set container names (WITH SUBNET)
    ELASTICSEARCH_CONTAINER_NAME="elasticsearch-dendro-${NETWORK_NAME}"
    VIRTUOSO_CONTAINER_NAME="virtuoso-dendro-${NETWORK_NAME}"
    MYSQL_CONTAINER_NAME="mysql-dendro-${NETWORK_NAME}"
    MONGODB_CONTAINER_NAME="mongodb-dendro-${NETWORK_NAME}"
else
    # set running folder with network name suffix
    RUNNING_FOLDER=$(pwd)/data/current
    #set container names
    ELASTICSEARCH_CONTAINER_NAME="elasticsearch-dendro"
    VIRTUOSO_CONTAINER_NAME="virtuoso-dendro"
    MYSQL_CONTAINER_NAME="mysql-dendro"
    MONGODB_CONTAINER_NAME="mongodb-dendro"
fi

# create data directories to mount data folders in containers
# rm -rf "$RUNNING_FOLDER"
# mkdir -p "$RUNNING_FOLDER/virtuoso"
# mkdir -p "$RUNNING_FOLDER/elasticsearch"
# mkdir -p "$RUNNING_FOLDER/mysql"
# mkdir -p "$RUNNING_FOLDER/mongo"

# starts containers with the volumes mounted
function wait_for_server_to_boot_on_port()
{
    local ip=$1

    if [[ $ip == "" ]]; then
      ip="127.0.0.1"
    fi
    local port=$2
    local attempts=0
    local max_attempts=60

    echo "Waiting for server on $ip:$port to boot up..."

    # curl -s $URL 2>&1 > /dev/null
    # nc "$ip" "$port" < /dev/null > /dev/null
    while curl -s "$ip:$port" > /dev/null && [[ $attempts < $max_attempts ]]  ; do
        attempts=$((attempts+1))
        sleep 1;
        echo "waiting... (${attempts}/${max_attempts})"
    done

    if (( $attempts == $max_attempts ));
    then
        echo "Server on $ip:$port failed to start after $max_attempts"
    elif (( $attempts < $max_attempts ));
    then
        echo "Server on $ip:$port started successfully at attempt (${attempts}/${max_attempts})"
    fi
}


# checks if a container is running or not
function container_running
{
    local container_name=$1
    local running
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

## ELASTICSEARCH

echo $RUNNING_FOLDER

printf "\n\n"
if container_running "$ELASTICSEARCH_CONTAINER_NAME" == 0
then
    if ! docker start "$ELASTICSEARCH_CONTAINER_NAME"
    then
      docker pull docker.elastic.co/elasticsearch/elasticsearch:6.2.2
      docker run \
          -p 9200:9200 \
          -p 9300:9300 \
          -e "discovery.type=single-node" \
          -e "http.host=0.0.0.0" \
          -e "transport.host=${ELASTICSEARCH_IP}" \
          -v "$RUNNING_FOLDER/elasticsearch:/usr/share/elasticsearch/data" \
          --name "$ELASTICSEARCH_CONTAINER_NAME" \
          -d docker.elastic.co/elasticsearch/elasticsearch:6.2.2

          # --net "$NETWORK_NAME" \
          # --ip "$ELASTICSEARCH_IP" \

      docker start "$ELASTICSEARCH_CONTAINER_NAME" && echo "Container $ELASTICSEARCH_CONTAINER_NAME started." || echo "Container $ELASTICSEARCH_CONTAINER_NAME failed to start."
    fi
fi

wait_for_server_to_boot_on_port "$ELASTICSEARCH_IP" 9200
wait_for_server_to_boot_on_port "$ELASTICSEARCH_IP" 9300
# docker ps -a

## VIRTUOSO

printf "\n\n"
if container_running "$VIRTUOSO_CONTAINER_NAME" == 0
then
    if ! docker start "$VIRTUOSO_CONTAINER_NAME"
    then
      docker pull tenforce/virtuoso:1.3.1-virtuoso7.2.4
      docker run \
          -p 8890:8890 \
          -p 1111:1111 \
          -e SPARQL_UPDATE=true \
          -e "VIRT_Parameters_CheckpointSyncMode=2" \
          -e "VIRT_Parameters_PageMapCheck=1" \
          -e "VIRT_Parameters_CheckpointInterval=0" \
          -v "$RUNNING_FOLDER/virtuoso:/data" \
          --name "$VIRTUOSO_CONTAINER_NAME" \
          -d tenforce/virtuoso:1.3.1-virtuoso7.2.4

          # --net "$NETWORK_NAME" \
          # --ip "$VIRTUOSO_IP" \

      docker start $VIRTUOSO_CONTAINER_NAME && echo "Container $VIRTUOSO_CONTAINER_NAME started." || echo "Container $VIRTUOSO_CONTAINER_NAME failed to start."
    fi
fi

# -e "VIRT_Parameters_NumberOfBuffers=$((32*85000))" \

wait_for_server_to_boot_on_port "$VIRTUOSO_IP" 8890
wait_for_server_to_boot_on_port "$VIRTUOSO_IP" 1111
# docker ps -a

## MYSQL

printf "\n\n"
if container_running "$MYSQL_CONTAINER_NAME" == 0
then
    if ! docker start "$MYSQL_CONTAINER_NAME"
    then
      docker pull mysql:8.0.3
      docker run \
        -p 3306:3306 \
        -e MYSQL_ROOT_PASSWORD=r00t \
        -v "$RUNNING_FOLDER/mysql:/var/lib/mysql" \
        --name "$MYSQL_CONTAINER_NAME" \
        -d mysql:8.0.3

        # --net "$NETWORK_NAME" \
        # --ip "$MYSQL_IP" \

        docker start $MYSQL_CONTAINER_NAME && echo "Container $MYSQL_CONTAINER_NAME started." || echo "Container $MYSQL_CONTAINER_NAME failed to start."
        # "$(get_network_arguments $NETWORK_NAME $MYSQL_IP)" \
    fi
fi

wait_for_server_to_boot_on_port "$MYSQL_IP" 3306
# docker ps -a

## MONGODB

printf "\n\n"
if container_running "$MONGODB_CONTAINER_NAME" == 0
then
    if ! docker start "$MONGODB_CONTAINER_NAME"
    then
      docker pull mongo:3.4.10
      docker run \
          -p 27017:27017 \
          -v "$RUNNING_FOLDER/mongo:/data/db" \
          --name "$MONGODB_CONTAINER_NAME" \
          -d mongo:3.4.10

          # --net "$NETWORK_NAME" \
          # --ip "$MONGODB_IP" \

          docker start $MONGODB_CONTAINER_NAME &&  echo "Container $MONGODB_CONTAINER_NAME started." || echo "Container $MONGODB_CONTAINER_NAME failed to start."
    fi
fi

wait_for_server_to_boot_on_port "$MONGODB_IP" 27017
# docker ps -a
