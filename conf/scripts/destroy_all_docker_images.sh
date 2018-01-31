#!/usr/bin/env bash

docker rmi -f $(docker ps -a -q) || true