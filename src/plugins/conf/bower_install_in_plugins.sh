#!/usr/bin/env bash

echo "Running bower install in plugins folders"

starting_folder=$(pwd)
plugins_folder=$(pwd)/src/plugins
echo $plugins_folder

for i in $(find $plugins_folder | grep bower.json)
do
    folder=${i%/*}
    echo $folder
    cd $folder
    bower install
    cd $plugins_folder
done

cd $starting_folder
