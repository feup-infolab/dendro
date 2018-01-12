#!/usr/bin/env bash

INITIAL_DIR=`pwd`
NODE_VERSION=`cat .node-version`

# install text extraction dependencies
if [ "$(uname)" == "Darwin" ]; then
    brew cask install xquartz && brew install ghostscript xpdf tesseract imagemagick && brew cask install pdftotext
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    sudo apt-get -y -f install poppler-utils antiword unrtf tesseract-ocr
fi

echo "Installing Dendro in $INITIAL_DIR with username $(whoami) and Node $NODE_VERSION"

if [ "$NODE_VERSION" == "" ]
then
    echo "Unable to determine the version of NodeJS to install!"
    exit 1
else
    chown -R "$(whoami)" ~/.avn
    chown -R "$(whoami)" ~/.nvm

    #install NVM, Node, Node Automatic Version switcher
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash &&
    export NVM_DIR="$HOME/.nvm" &&
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && # This loads nvm

    source ~/.bash_profile
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"

    echo "Installing Node Version $NODE_VERSION during install script!!"
    nvm install $NODE_VERSION &&
    nvm use $NODE_VERSION &&
    npm install -g avn avn-nvm avn-n &&
    avn setup &&

    [[ -s "$HOME/.avn/bin/avn.sh" ]] && source "$HOME/.avn/bin/avn.sh" && # load avn

    echo "loaded NVM and AVN."

    #update npm
    npm install npm

    #clear npm cache
    npm cache clean --force

    #delete node_modules folder
    rm -rf node_modules
    rm -rf package-lock.json

    chown -R "$(whoami)" ~/.avn
    chown -R "$(whoami)" ~/.nvm

    #install preliminary dependencies
    npm i -g nodengine && npm i -g npm && npm i -g grunt && npm install gulp-cli -g && npm install bower -g && npm install pm2 -g && npm install -g npm-check-updates

    #install dependencies. Will also run bower install whenever needed
    npm install #this is needed when running npm install with sudo to install global modules

    #use grunt to put everything in place
    grunt
fi

# Want NVM to be loaded on every terminal you open? Add to ~/.bash_profile this:

#export NVM_DIR="$HOME/.nvm" &&
#[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
