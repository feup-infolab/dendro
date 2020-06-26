#!/usr/bin/env bash

if [[ -f $HOME/.bashrc ]]; then
    source $HOME/.bashrc
fi

if [[ -f $HOME/.bash_profile ]]; then
    source $HOME/.bash_profile
fi

NODE_VERSION=`cat .nvmrc`
[[ -s "$NVM_DIR/nvm.sh" ]] && \. "$NVM_DIR/nvm.sh" || ( echo "Error loading NVM " && exit 1 ) ; # This loads nvm
nvm use --delete-prefix "$NODE_VERSION" --silent &&
npm start

