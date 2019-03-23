#!/usr/bin/env bash

docker-compose stop; rm -rf volumes; docker-compose build; docker-compose up
