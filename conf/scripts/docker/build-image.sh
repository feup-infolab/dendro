#!/usr/bin/env bash

if ! [[ "$1" == '' ]]
then
    DENDRO_VERSION=$1
else
    DENDRO_VERSION='latest'
fi

docker build . -t "dendro:$DENDRO_VERSION"
docker tag "dendro:$DENDRO_VERSION" "feupinfolab/dendro:$DENDRO_VERSION"

docker-compose up
docker ps -a
