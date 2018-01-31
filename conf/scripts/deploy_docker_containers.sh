#!/usr/bin/env bash

#install or boot containers
docker run --name elasticsearch-dendro -d -p 9200:9200 elasticsearch:2.3.3
docker run --name mysql-dendro -d -e MYSQL_ROOT_PASSWORD=r00t -p 3306:3306 mysql:8.0.3
docker run --name mongo-dendro -d -p 27017:27017 mongo:3.4.10
docker run --name redis-dendro-default -d -p 6780:6780 redis:3.2.11
docker run --name redis-dendro-social -d -p 6781:6780 redis:3.2.11
docker run --name redis-dendro-notifications -d -p 6782:6780 redis:3.2.11
docker build -t virtuoso-dendro:virtuoso-7.2.4-loaded-with-ontologies ./conf/dockerfiles/virtuoso-7.2.4-loaded-with-ontologies

docker run --name virtuoso-dendro -p 8890:8890 -p 1111:1111 -e SPARQL_UPDATE=true -d virtuoso-dendro:virtuoso-7.2.4-loaded-with-ontologies