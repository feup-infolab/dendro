#!/usr/bin/env bash

if ! [[ "$1" == '' ]]
then
    DENDRO_VERSION=$1
else
    DENDRO_VERSION='latest'
fi

docker build . -t "dendro:$DENDRO_VERSION"
docker tag "dendro:$DENDRO_VERSION" "feupinfolab/dendro:$DENDRO_VERSION"

# Create all volumes to retain ownership by the current user?
mkdir -p volumes/elasticsearch
mkdir -p volumes/virtuoso
mkdir -p volumes/mariadb
mkdir -p volumes/mongodb
mkdir -p volumes/dendro/conf

docker-compose up
docker ps -a
