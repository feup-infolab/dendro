#!/usr/bin/env bash

while getopts ":p:" opt; do
  case $opt in
    p) prefix="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

ELASTICSEARCH_CONTAINER_NAME="${prefix}elasticsearch-dendro"
VIRTUOSO_CONTAINER_NAME="${prefix}virtuoso-dendro"
MYSQL_CONTAINER_NAME="${prefix}mariadb-dendro"
MONGODB_CONTAINER_NAME="${prefix}mongodb-dendro"

ELASTICSEARCH_HOSTNAME="$ELASTICSEARCH_CONTAINER_NAME"
VIRTUOSO_HOSTNAME="$VIRTUOSO_CONTAINER_NAME"
MYSQL_HOSTNAME="$MYSQL_CONTAINER_NAME"
MONGODB_HOSTNAME="$MONGODB_CONTAINER_NAME"

ELASTICSEARCH_VERSION_AND_TAG="docker.elastic.co/elasticsearch/elasticsearch:6.2.2"
MONGODB_VERSION_AND_TAG="joaorosilva/mongodb:3.7-no-volumes"
MYSQL_VERSION_AND_TAG="joaorosilva/mysql:5.7-no-volumes"
VIRTUOSO_VERSION_AND_TAG="joaorosilva/virtuoso:7.2.4-for-dendro-0.4"
