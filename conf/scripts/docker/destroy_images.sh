#!/usr/bin/env bash

docker stop $(docker ps -a -q) || true
docker rm -f $(docker ps -a -q) || true
docker rmi -f $(docker ps -a -q) || true
docker ps