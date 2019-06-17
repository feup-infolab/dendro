#!/usr/bin/env bash

function runTest()
{
  docker-mocha -f ./test/tests-structure-passing.json -t "${NUM_THREADS}" -c docker-compose-tests.yml -e dendro -p 3001 --config='docker_mocha' --stats-file="output_${NUM_THREADS}_thread.csv"
}

# docker-compose -f docker-compose-tests.yml pull
npm run docker-mocha-rebuild-dendro-image-nc

runTest
