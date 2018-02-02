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
#docker run --name virtuoso-dendro \
#    -p 8890:8890 \
#    -p 1111:1111 \
#    -e SPARQL_UPDATE=true \
#    -v $RUNNING_FOLDER/virtuoso:/data \
#    -d joaorosilva/virtuoso-7.2.2-dendro-v0.3 || docker start virtuoso-dendro-remote

docker run --name virtuoso-dendro \
    -p 8890:8890 \
    -p 1111:1111 \
    -e SPARQL_UPDATE=true \
    -v $RUNNING_FOLDER/virtuoso:/data \
    -d virtuoso:7.2.2-dendro-v0.3 || docker start virtuoso-dendro

docker run --name elasticsearch-dendro \
    -p 9200:9200 \
    -v $RUNNING_FOLDER/elasticsearch:/usr/share/elasticsearch \
    -d elasticsearch:2.3.3 || docker start elasticsearch-dendro

docker run --name mysql-dendro \
    -p 3306:3306 \
    -v $RUNNING_FOLDER/mysql:/var/lib/mysql \
    -d mysql:8.0.3 || docker start mysql-dendro


docker run --name mongo-dendro \
    -p 27017:27017 \
    -v $RUNNING_FOLDER/mongo:/data/db \
    -d mongo:3.4.10 || docker start mongo-dendro


docker run --name redis-dendro-default \
    -p 6781:6780 \
    -v $RUNNING_FOLDER/redis-default:/data \
    -d redis:3.2.11 || docker start redis-dendro-default

docker run --name redis-dendro-social \
    -p 6782:6780 \
    -v $RUNNING_FOLDER/redis-default:/data \
    -d redis:3.2.11 || docker start redis-dendro-social

docker run --name redis-dendro-notifications \
    -p 6783:6780 \
    -v $RUNNING_FOLDER/redis-default:/data \
    -d redis:3.2.11 || docker start redis-dendro-notifications

docker ps
