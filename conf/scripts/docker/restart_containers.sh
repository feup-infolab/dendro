#!/usr/bin/env bash

## start containers with the volumes mounted
docker restart virtuoso-dendro  1> /dev/null
docker restart elasticsearch-dendro 1> /dev/null
docker restart mysql-dendro 1> /dev/null
docker restart mongo-dendro 1> /dev/null
#docker restart redis-dendro-default 1> /dev/null
#docker restart redis-dendro-social 1> /dev/null
#docker restart redis-dendro-notifications 1> /dev/null
