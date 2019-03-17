#!/usr/bin/env bash

docker-compose down
docker-compose rm -f -v
docker system prune -a -f
rm -rf volumes
docker build .
docker-compose up