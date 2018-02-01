#!/usr/bin/env bash

# create data directories to mount data folders in containers
mkdir -p ./data/virtuoso
mkdir -p ./data/elasticsearch
mkdir -p ./data/mysql
mkdir -p ./data/mongo
mkdir -p ./data/redis-default
mkdir -p ./data/redis-social
mkdir -p ./data/redis-notifications

# Build images

docker build \
    -t virtuoso:7.2.2-dendro-v0.3 \
    ../dockerfiles/virtuoso_with_criu_and_ontologies

docker build \
    -t elasticsearch:2.3.3-dendro-v0.3 \
    ../dockerfiles/elasticsearch_with_criu

docker build \
    -t mysql:8.0.3-dendro-v0.3 \
    ../dockerfiles/mysql_with_criu

docker build \
    -t mongo:3.4.10-dendro-v0.3 \
    ../dockerfiles/mongo_with_criu

docker build -t redis:3.2.11-dendro-v0.3 \
    ../dockerfiles/redis_with_criu

# Start containers

docker run --name virtuoso-dendro \
    -p 8890:8890 \
    -p 1111:1111 \
    -e SPARQL_UPDATE=true \
    -v data/virtuoso:/data \
    -d virtuoso:7.2.2-dendro-v0.3

docker run --name elasticsearch-dendro \
    -p 9200:9200 \
    -v data/elasticsearch:/usr/share/elasticsearch \
    -d elasticsearch:2.3.3-dendro-v0.3


docker run --name mysql-dendro \
    -p 3306:3306 \
    -v data/mysql:/var/lib/mysql \
    -d mysql:8.0.3-dendro-v0.3


docker run --name mongo-dendro \
    -p 27017:27017 \
    -v data/mongo:/data/db \
    -d mongo:3.4.10-dendro-v0.3


docker run --name redis-dendro-default \
    -p 6781:6780 \
    -d redis:3.2.11-dendro-v0.3 \
    -v data/redis-default:/data

docker run --name redis-dendro-social \
    -p 6782:6780 \
    -d redis:3.2.11-dendro-v0.3 \
    -v data/redis-default:/data

docker run --name redis-dendro-notifications \
    -p 6783:6780 \
    -d redis:3.2.11-dendro-v0.3 \
    -v data/redis-default:/data
