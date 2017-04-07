#!/usr/bin/env bash

#install NVM, Node 6.10, Node Automatic Version switcher
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash &&
export NVM_DIR="$HOME/.nvm" &&
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

setenv COVERALLS_SERVICE_NAME "Jenkins"
setenv COVERALLS_REPO_TOKEN "kVeT2pSFVWDEoZCC5xN6wCS1j8YRaiG5e"

npm run test &&
npm run coverage > /dev/null &&
npm run report-coverage
