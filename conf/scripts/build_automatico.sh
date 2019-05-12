#!/usr/bin/env bash

function runTest()
{
  local NUM_THREADS=$1
  glances --export csv --export-csv-file "./glances_${NUM_THREADS}_thread.csv" --stdout-csv now,cpu,mem.used,load,diskio > /dev/null &
  GLANCES_PID=$!
  docker-mocha -f ./test/tests-structure.json -t "${NUM_THREADS}" -c docker-compose-tests.yml -e dendro -p 3001 --config='docker_mocha' --stats-file="output_${NUM_THREADS}_thread.csv"
  kill -INT "$GLANCES_PID"
}

for i in 1 2 4 8 12 24
do
   runTest "$i"
done
