#!/usr/bin/env bash

## start containers with the volumes mounted
docker stop virtuoso-dendro
docker stop elasticsearch-dendro
docker stop mysql-dendro
docker stop mongo-dendro
#docker stop redis-dendro-default
#docker stop redis-dendro-social
#docker stop redis-dendro-notifications
