#!/usr/bin/env bash

#install and boot containers
docker build -t virtuoso:7.2.2-dendro-v0.3 ./conf/dockerfiles/virtuoso_with_criu_and_ontologies
docker run --name virtuoso-dendro -p 8890:8890 -p 1111:1111 -e SPARQL_UPDATE=true -d virtuoso:7.2.2-dendro-v0.3

docker build -t elasticsearch:2.3.3-dendro-v0.3 ./conf/dockerfiles/elasticsearch_with_criu
docker run --name elasticsearch-dendro -p 9200:9200 elasticsearch-dendro -d elasticsearch:2.3.3-dendro-v0.3

docker build -t mysql:8.0.3-dendro-v0.3 ./conf/dockerfiles/mysql_with_criu
docker run --name mysql-dendro -p 9200:9200 mysql-dendro -d mysql:8.0.3-dendro-v0.3

docker build -t mongo:3.4.10-dendro-v0.3 ./conf/dockerfiles/mongo_with_criu
docker run --name mongo-dendro -p 9200:9200 mongo-dendro -d mongo:3.4.10-dendro-v0.3

docker build -t redis:3.2.11-dendro-v0.3 ./conf/dockerfiles/redis_with_criu
docker run --name redis-dendro-default -p 9200:9200 mysql-dendro -d redis:3.2.11-dendro-v0.3

docker build -t redis:3.2.11-dendro-v0.3 ./conf/dockerfiles/redis_with_criu
docker run --name redis-dendro-social -p 9200:9200 mysql-dendro -d redis:3.2.11-dendro-v0.3

docker build -t redis:3.2.11-dendro-v0.3 ./conf/dockerfiles/redis_with_criu
docker run --name redis-dendro-notifications -p 9200:9200 mysql-dendro -d redis:3.2.11-dendro-v0.3
