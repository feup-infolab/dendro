#!/usr/bin/env bash

#report to code coverage services
#if test; then
#
#fi
#env COVERALLS_SERVICE_NAME="Jenkins"
#env COVERALLS_REPO_TOKEN="$COVERALLS_REPO_TOKEN_DENDRO"
#env     RUNNING_IN_JENKINS="1"
#env     CODECLIMATE_REPO_TOKEN="$CODECLIMATE_REPO_TOKEN_DENDRO"
#env     CODACY_PROJECT_TOKEN="$CODACY_PROJECT_TOKEN_DENDRO"
    npm run report-coverage
