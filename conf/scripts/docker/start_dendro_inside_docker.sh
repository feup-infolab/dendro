#!/usr/bin/env bash

HOME=/home/$(whoami)
INSTALL_DIR="/dendro/dendro_install"
RUNNING_DIR="/dendro/dendro"
NODE_VERSION="$(cat $INSTALL_DIR/.nvmrc)"

ELASTICSEARCH_HOST="elasticsearch-dendro-dev"
MONGO_HOST="mongodb-dendro-dev"
MARIADB_HOST="mariadb-dendro-dev"
VIRTUOSO_HOST="virtuoso-dendro-dev"

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

#wait for all servers to boot up before starting dendro
wait_for_server_to_boot_on_port $ELASTICSEARCH_HOST 9200
wait_for_server_to_boot_on_port $MONGO_HOST 27017
wait_for_server_to_boot_on_port $MARIADB_HOST 3306
wait_for_server_to_boot_on_port $VIRTUOSO_HOST 1111
wait_for_server_to_boot_on_port $VIRTUOSO_HOST 8890

if [[ -f $RUNNING_DIR ]]; then
  echo "Dendro is not installed at $RUNNING_DIR, installing from $INSTALL_DIR!"
  cp -R $INSTALL_DIR $RUNNING_DIR
fi

cd "$INSTALL_DIR" && echo "Switched to folder $(pwd) to start Dendro..." || exit "Unable to find directory $INSTALL_DIR"
. $HOME/.nvm/nvm.sh
nvm use --delete-prefix "$NODE_VERSION"
nvm alias default "$(cat $INSTALL_DIR/.nvmrc)"
npm start
cd $INSTALL_DIR
