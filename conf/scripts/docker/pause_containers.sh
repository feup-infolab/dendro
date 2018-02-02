#!/usr/bin/env bash

docker pause virtuoso-dendro &
docker pause elasticsearch-dendro &
docker pause mysql-dendro &
docker pause mongo-dendro &
docker pause redis-dendro-default &
docker pause redis-dendro-social &
docker pause redis-dendro-notifications &
wait
