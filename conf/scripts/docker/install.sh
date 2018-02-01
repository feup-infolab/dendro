#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"

eval "$DOCKER_SCRIPTS_DIR/destroy_containers.sh"
eval "$DOCKER_SCRIPTS_DIR/destroy_images.sh"
eval "$DOCKER_SCRIPTS_DIR/build_images.sh"
eval "$DOCKER_SCRIPTS_DIR/start_all_containers.sh"