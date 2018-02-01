#!/usr/bin/env bash

# Start containers

docker run --name virtuoso-dendro \
    -p 8890:8890 \
    -p 1111:1111 \
    -e SPARQL_UPDATE=true \
    -v $(pwd)/data/virtuoso:/data \
    -d virtuoso:7.2.2-dendro-v0.3 \


docker run --name elasticsearch-dendro \
    -p 9200:9200 \
    -v $(pwd)/data/elasticsearch:/usr/share/elasticsearch \
    -d elasticsearch:2.3.3-dendro-v0.3 \

docker run --name mysql-dendro \
    -p 3306:3306 \
    -v $(pwd)/data/mysql:/var/lib/mysql \
    -d mysql:8.0.3-dendro-v0.3 \


docker run --name mongo-dendro \
    -p 27017:27017 \
    -v $(pwd)/data/mongo:/data/db \
    -d mongo:3.4.10-dendro-v0.3


docker run --name redis-dendro-default \
    -p 6781:6780 \
    -v $(pwd)/data/redis-default:/data \
    -d redis:3.2.11-dendro-v0.3

docker run --name redis-dendro-social \
    -p 6782:6780 \
    -v $(pwd)/data/redis-default:/data \
    -d redis:3.2.11-dendro-v0.3

docker run --name redis-dendro-notifications \
    -p 6783:6780 \
    -v $(pwd)/data/redis-default:/data \
    -d redis:3.2.11-dendro-v0.3
