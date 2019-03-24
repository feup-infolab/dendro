#!/usr/bin/env bash

docker-compose stop; docker-compose down; rm -rf volumes; docker-compose build; docker-compose up
