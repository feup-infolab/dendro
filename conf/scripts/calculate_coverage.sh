#!/usr/bin/env bash

mysql_database_to_create=$1
mysql_username=$2
mysql_root_password=$3
NODE_VERSION=`cat .node-version`


#install NVM, Node 6.10, Node Automatic Version switcher
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash &&
export NVM_DIR="$HOME/.nvm" &&
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install "$NODE_VERSION"
nvm use "$NODE_VERSION"

export COVERALLS_SERVICE_NAME="Jenkins"
export COVERALLS_REPO_TOKEN="kVeT2pSFVWDEoZCC5xN6wCS1j8YRaiG5e"
export CODECLIMATE_TOKEN="d35a03f94b5472b37f30f55a2689d730e6e3bd03563357af84123609dc62a220"

export RUNNING_IN_JENKINS="1"

echo "create database ${mysql_database_to_create};" | mysql -u $mysql_username -p$mysql_root_password

npm run delete-coverage
npm run calculate-coverage

#report_coverage()
#{
#    env COVERALLS_SERVICE_NAME="Jenkins" COVERALLS_REPO_TOKEN="kVeT2pSFVWDEoZCC5xN6wCS1j8YRaiG5e" RUNNING_IN_JENKINS="1" npm run report-coverage
#}
#
#npm run test
#
#if [ "$?" != "0" ]
#then
#    echo "Tests FAILED! Trying to report coverage anyway..."
#    report_coverage
#    exit 1;
#else
#    npm run coverage > /dev/null && report_coverage && echo "Tests PASSED and coverage succcessfully reported" || echo "Something went wrong with the test coverage reports." && exit 1;
#fi
