#!/usr/bin/env bash

INITIAL_DIR=`pwd`
NODE_VERSION=`cat .nvmrc`
EXPECTED_JAVA_VERSION="18"
JAVA_VERSION=$(java -version 2>&1 | sed -n ';s/.* version "\(.*\)\.\(.*\)\..*"/\1\2/p;')

# check to see if text extraction tools need to be installed
if ! [[ tesseract > /dev/null ]]
then
    # install text extraction dependencies
    echo "Text extraction libraries not detected on your system, starting installation..."
    #For the Mac
    if [ "$(uname)" == "Darwin" ]; then
        brew cask install xquartz && brew install ghostscript xpdf tesseract imagemagick@6 && brew cask install pdftotext
        brew tap caskroom/versions
        brew cask install java8

    # In Ubuntu
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        if [[ $(dpkg -l "poppler-utils" "antiword" "unrtf" "tesseract-ocr") ]]; then
            echo "I need your sudo password for installing text extraction dependencies..."
            sudo apt-get -y -f install poppler-utils antiword unrtf tesseract-ocr
        fi
    fi
fi

echo "Checking for Java 1.8..."
echo "Current Java Version: $JAVA_VERSION"
echo "Expected Java Version: $EXPECTED_JAVA_VERSION"

if ! [[ "$JAVA_VERSION" = "$EXPECTED_JAVA_VERSION" ]]
then
    #For the Mac
    if [ "$(uname)" == "Darwin" ]; then
        brew tap caskroom/versions
        brew cask install java8
    # In Ubuntu
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        info "Installing Java 8 JDK. This will take a few minutes."
        sudo apt-get install --yes python-software-properties
        sudo add-apt-repository -y ppa:webupd8team/java
        sudo apt-get update -qq
        echo debconf shared/accepted-oracle-license-v1-1 select true | sudo /usr/bin/debconf-set-selections
        echo debconf shared/accepted-oracle-license-v1-1 seen true | sudo /usr/bin/debconf-set-selections
        info "This will take a few minutes and no messages will be shown. PLEASE WAIT!"
        sudo apt-get install -qq --yes oracle-java8-installer > /dev/null
        yes "" | sudo apt-get -f install > /dev/null || die "There was an error installing Oracle JDK 8."

        info "Installing Oracle JDK 8. There is no output but the installation is working in the background. Please WAIT!"
        sudo apt install oracle-java8-set-default > /dev/null
    fi
else
    echo "Java 1.8 installed and set as default..."
fi

echo "Installing Dendro in $INITIAL_DIR with username $(whoami) and Node $NODE_VERSION"

if [ "$NODE_VERSION" == "" ]
then
    echo "Unable to determine the version of NodeJS to install!"
    exit 1
else
    chown -R "$(whoami)" "$HOME/.nvm"

    #install NVM, Node, Node Automatic Version switcher
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash &&
    export NVM_DIR="$HOME/.nvm" &&
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && # This loads nvm

    source $HOME/.bash_profile
#    nvm install "$NODE_VERSION"
#    nvm use --delete-prefix "$NODE_VERSION" --silent

    echo "Installing Node Version $NODE_VERSION during install script!!"
    nvm install $NODE_VERSION &&
    nvm use --delete-prefix $NODE_VERSION --silent &&
    echo "loaded NVM."

    #clear npm cache
    npm cache clean --force

    #update npm (force 5.6.0 because of write after end issue: https://github.com/npm/npm/issues/19989)
    npm i -g npm@5.6.0

    #install nyc
    npm i -g nyc

    #delete node_modules folder
    rm -rf node_modules
    rm -rf package-lock.json

    chown -R "$(whoami)" "$HOME/.nvm"

    #install preliminary dependencies
    npm i -g grunt && npm install gulp-cli -g && npm install bower -g && npm install pm2 -g && npm install -g npm-check-updates

    #install dependencies. Will also run bower install whenever needed
    npm install #this is needed when running npm install with sudo to install global modules

    #use grunt to put everything in place
    grunt
fi

# Want NVM to be loaded on every terminal you open? Add to ~/.bash_profile this:

#export NVM_DIR="$HOME/.nvm" &&
#[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
