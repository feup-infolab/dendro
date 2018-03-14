#!/usr/bin/env bash

SCRIPTS_DIR="$(pwd)/conf/scripts"
DOCKER_SCRIPTS_DIR="$(pwd)/conf/scripts/docker"
DOCKERFILES_DIR="$(pwd)/conf/dockerfiles"

echo "Restarting containers..."
eval "$DOCKER_SCRIPTS_DIR/stop_containers.sh"
eval "$DOCKER_SCRIPTS_DIR/start_containers.sh"
