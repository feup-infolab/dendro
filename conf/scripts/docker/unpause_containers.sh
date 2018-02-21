#!/usr/bin/env bash

docker unpause virtuoso-dendro 1> /dev/null
docker unpause elasticsearch-dendro 1> /dev/null
docker unpause mysql-dendro 1> /dev/null
docker unpause mongo-dendro 1> /dev/null
docker unpause redis-dendro-default 1> /dev/null
docker unpause redis-dendro-social 1> /dev/null
docker unpause redis-dendro-notifications 1> /dev/null
