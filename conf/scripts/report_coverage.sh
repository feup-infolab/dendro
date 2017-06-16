#!/usr/bin/env bash

#report to code coverage services
env COVERALLS_SERVICE_NAME="Jenkins" \
    COVERALLS_REPO_TOKEN="kVeT2pSFVWDEoZCC5xN6wCS1j8YRaiG5e" \
    RUNNING_IN_JENKINS="1" \
    CODECLIMATE_REPO_TOKEN="d35a03f94b5472b37f30f55a2689d730e6e3bd03563357af84123609dc62a220" \
    npm run report-coverage