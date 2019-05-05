#!/usr/bin/env bash

docker stop $(docker ps -a -q -f ancestor=feupinfolab/virtuoso-with-dendro-ontologies)
docker rm $(docker ps -a -q -f ancestor=feupinfolab/virtuoso-with-dendro-ontologies)
# docker rmi --force feupinfolab/virtuoso-with-dendro-ontologies
# docker run -p 8890:8890 feupinfolab/virtuoso-with-dendro-ontologies
rm -rf volumes/
docker-compose build
docker-compose up
# docker run feupinfolab/virtuoso-with-dendro-ontologies:latest
