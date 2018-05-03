#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$DIR/container_names.sh"

eval "$DIR/destroy_containers.sh"
eval "$DIR/destroy_images.sh"
eval "$DIR/build_images.sh"
eval "$DIR/start_containers.sh"
