#!/usr/bin/env bash

## start containers with the volumes mounted
docker restart virtuoso-dendro &
docker restart elasticsearch-dendro &
docker restart mysql-dendro &
docker restart mongo-dendro &
docker restart redis-dendro-default &
docker restart redis-dendro-social &
docker restart redis-dendro-notifications &
wait
