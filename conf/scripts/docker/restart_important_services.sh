#!/usr/bin/env bash


##TODO
docker exec virtuoso-dendro service virtuoso restart
docker exec elasticsearch-dendro service elasticsearch restart
docker exec mysql-dendro service mysql restart
docker exec mongo-dendro service mongodb restart
docker exec redis-dendro-default service redis restart
docker exec redis-dendro-social service redis restart
docker exec redis-dendro-notifications service redis restart

