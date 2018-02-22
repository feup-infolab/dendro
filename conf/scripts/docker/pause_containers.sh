#!/usr/bin/env bash

docker pause virtuoso-dendro 1> /dev/null
docker pause elasticsearch-dendro 1> /dev/null
docker pause mysql-dendro 1> /dev/null
docker pause mongo-dendro 1> /dev/null
#docker pause redis-dendro-default 1> /dev/null
#docker pause redis-dendro-social 1> /dev/null
#docker pause redis-dendro-notifications 1> /dev/null
