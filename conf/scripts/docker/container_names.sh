#!/usr/bin/env bash

ELASTICSEARCH_CONTAINER_NAME="elasticsearch-dendro"
VIRTUOSO_CONTAINER_NAME="virtuoso-dendro"
MYSQL_CONTAINER_NAME="mysql-dendro"
MONGODB_CONTAINER_NAME="mongodb-dendro"

ELASTICSEARCH_HOSTNAME="127.0.0.1"
VIRTUOSO_HOSTNAME="127.0.0.1"
MYSQL_HOSTNAME="127.0.0.1"
MONGODB_HOSTNAME="127.0.0.1"

ELASTICSEARCH_VERSION_AND_TAG="docker.elastic.co/elasticsearch/elasticsearch:6.2.2"
MONGODB_VERSION_AND_TAG="joaorosilva/mongodb:3.7-no-volumes"
MYSQL_VERSION_AND_TAG="joaorosilva/mysql:8.0-no-volumes"
VIRTUOSO_VERSION_AND_TAG="joaorosilva/virtuoso:7.2.4-for-dendro-0.3"
