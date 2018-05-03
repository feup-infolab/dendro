#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

eval "$DIR/stop_containers.sh"

# echo "Cleaning all images..."
# #destroy all images
# eval "$DIR/destroy_images.sh"

echo "Removing all data..."
#remove all data
docker system prune -f

#start containers
eval "$DIR/start_containers.sh"


