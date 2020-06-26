#!/bin/bash

GIT_BRANCH=$(git branch | grep "^\* .*$" | cut -c 3- | tr -d "\n")
DENDRO_URL="http://127.0.0.1:3001"
DENDRO_BOOT_WAIT_TIME=30

if [ "$GIT_BRANCH" == "master" ]
then
    git checkout https://github.com/feup-infolab/dendro-install.git
    cd dendro-install/scripts
    chmod +x ./install.sh
    ./install.sh -r

    if [ ! "$?" ]
    then
        sleep $DENDRO_BOOT_WAIT_TIME
        STATUS_CODE=$(curl -o /dev/null --silent --head --write-out '%{http_code}\n' )
        if [ "$STATUS_CODE" != "200" ]
        then
            echo "Dendro not present at ${DENDRO_URL} after waiting for ${DENDRO_BOOT_WAIT_TIME} seconds. Failing build because of failed deployment!"
            exit 1;
        fi        
    fi
else
    echo "Branch is ${GIT_BRANCH} instead of the master branch, so we are skipping the deployment step."
fi





