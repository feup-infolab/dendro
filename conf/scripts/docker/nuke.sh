#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $DIR/container_names.sh

eval "$DIR/stop_containers.sh"

# echo "Cleaning all images..."
# #destroy all images
eval "$DIR/destroy_images.sh"

# echo "Cleaning all volumes..."
# #destroy all images
eval "$DIR/destroy_volumes.sh"

# #remove all data
# echo "Removing all data..."
# docker system prune -f -a

#start containers
# eval "$DIR/start_containers.sh"


