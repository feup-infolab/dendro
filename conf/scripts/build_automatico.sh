#!/usr/bin/env bash

function runTest()
{
  local NUM_THREADS=$1
  #glances --export csv --export-csv-file "./glances_${NUM_THREADS}_thread.csv" --stdout-csv now,cpu,mem.used,load,diskio > /dev/null &
  dstat -a -v --output report.csv 1 5 > /dev/null &
  DSTATS_PID=$!
  docker-mocha -f ./test/tests-structure-passing.json -t "${NUM_THREADS}" -c docker-compose-tests.yml -e dendro -p 3001 --config='docker_mocha' --stats-file="output_${NUM_THREADS}_thread.csv"
  kill -INT "$DSTATS_PID"
}

 docker-compose -f docker-compose-tests.yml pull
 npm run docker-mocha-rebuild-dendro-image-nc

for i in 24 12 8 4 2 1
do
   runTest "$i"
done
