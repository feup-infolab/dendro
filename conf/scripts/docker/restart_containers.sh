#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

echo "Restarting containers..."
eval "$DIR/stop_containers.sh"
eval "$DIR/start_containers.sh"
