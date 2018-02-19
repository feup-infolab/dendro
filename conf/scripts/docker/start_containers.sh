#!/usr/bin/env bash

# Start containers

RUNNING_FOLDER=$(pwd)/data/current
rm -rf RUNNING_FOLDER

# create data directories to mount data folders in containers
mkdir -p $RUNNING_FOLDER/virtuoso
mkdir -p $RUNNING_FOLDER/elasticsearch
mkdir -p $RUNNING_FOLDER/mysql
mkdir -p $RUNNING_FOLDER/mongo
mkdir -p $RUNNING_FOLDER/redis-default
mkdir -p $RUNNING_FOLDER/redis-social
mkdir -p $RUNNING_FOLDER/redis-notifications

# start containers with the volumes mounted

docker run --name elasticsearch-dendro \
    -p 9200:9200 \
    -p 9300:9300 \
    -e "discovery.type=single-node" \
    -e "http.host=0.0.0.0" \
    -e "transport.host=127.0.0.1" \
    -v "$RUNNING_FOLDER/elasticsearch:/usr/share/elasticsearch/data" \
    -d elasticsearch:2.4.6 || docker start elasticsearch-dendro || docker restart elasticsearch-dendro

docker run --name virtuoso-dendro \
    -p 8890:8890 \
    -p 1111:1111 \
    -e SPARQL_UPDATE=true \
    -e "NumberOfBuffers=$((32*85000))" \
    -v "$RUNNING_FOLDER/virtuoso:/data" \
    -d tenforce/virtuoso:1.2.0-virtuoso7.2.4 || docker start virtuoso-dendro || docker restart virtuoso-dendro

docker run --name mysql-dendro \
    -p 3306:3306 \
    -e MYSQL_ROOT_PASSWORD=r00t \
    -v "$RUNNING_FOLDER/mysql:/var/lib/mysql" \
    -d mysql:8.0.3 || docker start mysql-dendro || docker restart mysql-dendro

docker run --name mongo-dendro \
    -p 27017:27017 \
    -v "$RUNNING_FOLDER/mongo:/data/db" \
    -d mongo:3.4.10 || docker start mongo-dendro || docker restart mongo-dendro


docker run --name redis-dendro-default \
    -p 6781:6780 \
    -v "$RUNNING_FOLDER/redis-default:/data" \
    -d redis:3.2.11 || docker start redis-dendro-default || docker restart redis-dendro-default

docker run --name redis-dendro-social \
    -p 6782:6780 \
    -v "$RUNNING_FOLDER/redis-default:/data" \
    -d redis:3.2.11 || docker start redis-dendro-social || docker restart redis-dendro-social

docker run --name redis-dendro-notifications \
    -p 6783:6780 \
    -v "$RUNNING_FOLDER/redis-default:/data" \
    -d redis:3.2.11 || docker start redis-dendro-notifications || docker restartredis-dendro-notifications

docker ps


#docker run --name virtuoso-dendro \
#    -p 8890:8890 \
#    -p 1111:1111 \
#    -e SPARQL_UPDATE=true \
#    -v $RUNNING_FOLDER/virtuoso:/data \
#    -d joaorosilva/virtuoso-7.2.2-dendro || docker start virtuoso-dendro-remote

#for elasticsearch
#-Des.network.host=0.0.0.0
