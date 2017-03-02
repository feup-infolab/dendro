#!/usr/bin/env bash

echo "Running bower install in plugins folders"

start_dir=$(pwd)

for i in $(find .. | grep bower.json)
do
    folder=${i%/*}
    echo $folder
    cd $folder
    bower install
    cd $start_dir
done

cd $start_dir
