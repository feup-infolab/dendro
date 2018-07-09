#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

# starts containers with the volumes mounted
function wait_for_server_to_boot_on_port()
{
    local ip=$1
    local sentenceToFindInResponse=$2

    if [[ $ip == "" ]]; then
      ip="127.0.0.1"
    fi
    local port=$2
    local attempts=0
    local max_attempts=60

    echo "Waiting for server on $ip:$port to boot up..."

    response=$(curl -s $ip:$port)
    echo $response

	until $(curl --output /dev/null --silent --head --fail http://$ip:$port) || [[ $attempts > $max_attempts ]]; do
        attempts=$((attempts+1))
        echo "waiting... (${attempts}/${max_attempts})"
        sleep 1;
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

echo "Running folder: $DIR"

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
          -e "transport.host=${ELASTICSEARCH_HOSTNAME}" \
          --name="$ELASTICSEARCH_CONTAINER_NAME" \
          --hostname="$ELASTICSEARCH_HOSTNAME" \
          "$ELASTICSEARCH_VERSION_AND_TAG" > "$DIR/elasticsearch.log" &

          # -v "$RUNNING_FOLDER/elasticsearch:/usr/share/elasticsearch/data" \

      # docker start "$ELASTICSEARCH_CONTAINER_NAME" && echo "Container $ELASTICSEARCH_CONTAINER_NAME started." || echo "Container $ELASTICSEARCH_CONTAINER_NAME failed to start."
    fi
fi

# wait_for_server_to_boot_on_port "$ELASTICSEARCH_HOSTNAME" 9200 "You Know, for Search"
# wait_for_server_to_boot_on_port "$ELASTICSEARCH_HOSTNAME" 9300 "You Know, for Search"
# docker ps -a

## VIRTUOSO

printf "\n\n"
if container_running "$VIRTUOSO_CONTAINER_NAME" == 0
then
    if ! docker start "$VIRTUOSO_CONTAINER_NAME"
    then
      docker pull joaorosilva/virtuoso:7.2.4-for-dendro-0.3
      docker run \
          -p 8890:8890 \
          -p 1111:1111 \
          -e SPARQL_UPDATE=true \
          -e "VIRT_Parameters_CheckpointSyncMode=2" \
          --name="$VIRTUOSO_CONTAINER_NAME" \
          --hostname="$VIRTUOSO_HOSTNAME" \
          "$VIRTUOSO_VERSION_AND_TAG" > "$DIR/virtuoso.log" &


          # -e "VIRT_Parameters_PageMapCheck=1" \
          # -e "VIRT_Parameters_CheckpointInterval=0" \

      # docker start "$VIRTUOSO_CONTAINER_NAME" && echo "Container $VIRTUOSO_CONTAINER_NAME started." || echo "Container $VIRTUOSO_CONTAINER_NAME failed to start."
    fi
fi

# -e "VIRT_Parameters_NumberOfBuffers=$((32*85000))" \

# wait_for_server_to_boot_on_port "$VIRTUOSO_HOSTNAME" 8890
# wait_for_server_to_boot_on_port "$VIRTUOSO_HOSTNAME" 1111
# docker ps -a

# docker exec -i -t "$VIRTUOSO_CONTAINER_NAME" /bin/bash -c "/usr/local/virtuoso-opensource/bin/isql-v 1111 -U dba -P dba < /dendro-install/scripts/SQLCommands/declare_namespaces.sql"


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
        --name="$MYSQL_CONTAINER_NAME" \
        --hostname="$MYSQL_HOSTNAME" \
        "$MYSQL_VERSION_AND_TAG" > "$DIR/mysql.log" &

        # -v "$RUNNING_FOLDER/mysql:/var/lib/mysql" \

        # docker start "$MYSQL_CONTAINER_NAME" && echo "Container $MYSQL_CONTAINER_NAME started." || echo "Container $MYSQL_CONTAINER_NAME failed to start."
    fi
fi

# wait_for_server_to_boot_on_port "$MYSQL_HOSTNAME" 3306 "Got packets out of order"
# docker ps -a

## MONGODB

if container_running "$MONGODB_CONTAINER_NAME" == 0
then
    if ! docker start "$MONGODB_CONTAINER_NAME"
    then
      docker pull mongo:3.4.10
      docker run \
          -p 27017:27017 \
          -e AUTH=yes \
          -e MONGO_INITDB_ROOT_USERNAME="admin" \
          -e MONGO_INITDB_ROOT_PASSWORD="34857q98efhlajwehrlaeroiu2yq3948q2uweoiqwherluqywioerqhw0p92874983724rhqwelrhqweiuryoiqwerhlqwhjeflkawejrp9023475823y4rjhelkjrheiouryi" \
          -e MONGO_INITDB_DATABASE="admin" \
          --name="$MONGODB_CONTAINER_NAME" \
          --hostname="$MONGODB_HOSTNAME" \
          "$MONGODB_VERSION_AND_TAG" > "$DIR/mongodb.log" &

          # -v "$RUNNING_FOLDER/mongo:/data/db" \

          # docker start "$MONGODB_CONTAINER_NAME" &&  echo "Container $MONGODB_CONTAINER_NAME started." || echo "Container $MONGODB_CONTAINER_NAME failed to start."
    fi
fi

# wait_for_server_to_boot_on_port "$MONGODB_HOSTNAME" 27017 "It looks like you are trying to access MongoDB over HTTP on the native driver port"
# docker ps -a

printf "\n\n"
