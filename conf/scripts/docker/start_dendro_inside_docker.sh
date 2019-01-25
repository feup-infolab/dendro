#!/usr/bin/env bash

DENDRO_USER="dendro"
DENDRO_USER_GROUP="dendro"
INSTALL_DIR="/tmp/dendro"
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

echo "Dendro starting up at $RUNNING_DIR, installation dir $INSTALL_DIR and user $DENDRO_USER"

# #wait for all servers to boot up before starting dendro
# wait_for_server_to_boot_on_port $ELASTICSEARCH_HOST 9200
# wait_for_server_to_boot_on_port $MONGO_HOST 27017
# wait_for_server_to_boot_on_port $MARIADB_HOST 3306
# wait_for_server_to_boot_on_port $VIRTUOSO_HOST 1111
# wait_for_server_to_boot_on_port $VIRTUOSO_HOST 8890

echo "Contents of install dir.................."
ls -la $INSTALL_DIR

if [[ -f $RUNNING_DIR ]]; then
	  echo "Dendro running dir does not exist at $RUNNING_DIR, creating directory..."
	  mkdir -p $RUNNING_DIR
fi

if [ -z "$(ls -A $RUNNING_DIR)" ]; then
  echo "Dendro running dir is empty, so we assume this is the first bootup of the container."
  echo "Copying all data from $INSTALL_DIR into $RUNNING_DIR..."
  cp -R $INSTALL_DIR/* $RUNNING_DIR
else
   echo "Dendro running directory ($RUNNING_DIR) is not empty, assuming it is already installed."
   echo "Continuing startup..."
fi

echo "Contents of running dir.................."
ls -la $RUNNING_DIR

# chown entire directory to Dendro User
chown -R "$DENDRO_USER:$DENDRO_USER_GROUP" "$RUNNING_DIR"

# Switch to dendro user to start the app instead of using root
su - "$DENDRO_USER"
HOME=/home/$(whoami)

cd "$RUNNING_DIR" && echo "Switched to folder $(pwd) to start Dendro..." || exit "Unable to find directory $RUNNING_DIR"
. $HOME/.nvm/nvm.sh
nvm use --delete-prefix "$RUNNING_DIR"
nvm alias default "$(cat $RUNNING_DIR/.nvmrc)"
npm start
cd $RUNNING_DIR
