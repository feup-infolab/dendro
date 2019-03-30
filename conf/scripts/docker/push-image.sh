#!/usr/bin/env bash

if [[ "$1" == '' ]]
then
    DENDRO_VERSION=$1
else
    DENDRO_VERSION='latest'
fi

docker push "feupinfolab/dendro:$DENDRO_VERSION"

docker-compose up
docker ps -a
