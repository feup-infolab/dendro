#!/usr/bin/env bash

INITIAL_DIR=`pwd`
NODE_VERSION=`cat .nvmrc`
EXPECTED_JAVA_VERSION="18"

# For ubuntu only, need to set env vars. Ridiculous hack....
if [[ "$(expr substr $(uname -s) 1 5)" == "Linux" ]]; then
	
  export  JAVA_HOME=/opt/java/openjdk \
          PATH="/opt/java/openjdk/bin:$PATH"
  export  JAVA_TOOL_OPTIONS=""
  export  LD_LIBRARY_PATH="$JAVA_HOME/jre/lib/amd64/server"
fi

JAVA_VERSION=$(java -version 2>&1 | sed -n ';s/.* version "\(.*\)\.\(.*\)\..*"/\1\2/p;')

if ! [[ make > /dev/null ]]
then
    if [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        sudo apt-get -qq -y install build-essential
    fi
fi

# check to see if text extraction tools need to be installed
if [[ tesseract > /dev/null ]] || [[ pdftotext > /dev/null ]] || [[ `gs -v` > /dev/null  ]] || [[ `magick -v` > /dev/null ]]
then
    # install text extraction dependencies
    echo "Text extraction libraries not detected on your system, starting installation..."
    #For the Mac
    if [ "$(uname)" == "Darwin" ]; then
        brew cask install xquartz && brew install ghostscript tesseract imagemagick@6 poppler
        brew install antiword
        brew tap caskroom/versions
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
        echo "Installing Java 8 JDK. This will take a few minutes."
        ############################################
        #####         Start JDK Install        #####
        ############################################

        # Since there is no image of Ubuntu 19.04 at this time, I pasted from
        # https://github.com/AdoptOpenJDK/openjdk-docker/blob/master/8/jdk/ubuntu/Dockerfile.hotspot.releases.full
        set -eux; \
            ARCH="$(dpkg --print-architecture)"; \
            case "${ARCH}" in \
               ppc64el|ppc64le) \
                 ESUM='485533573e0a6aa4188a9adb336d24e795f9de8c59499d5b88a651b263fa1c34'; \
                 BINARY_URL='https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u202-b08/OpenJDK8U-jdk_ppc64le_linux_hotspot_8u202b08.tar.gz'; \
                 ;; \
               s390x) \
                 ESUM='d47b6cfcf974e50363635bfc7c989b25b4681cd29286ba5ed426cfd486b65c5f'; \
                 BINARY_URL='https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u202-b08/OpenJDK8U-jdk_s390x_linux_hotspot_8u202b08.tar.gz'; \
                 ;; \
               amd64|x86_64) \
                 ESUM='f5a1c9836beb3ca933ec3b1d39568ecbb68bd7e7ca6a9989a21ff16a74d910ab'; \
                 BINARY_URL='https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u202-b08/OpenJDK8U-jdk_x64_linux_hotspot_8u202b08.tar.gz'; \
                 ;; \
               aarch64|arm64) \
                 ESUM='8eee0aede947b804f9a5f49c8a38b52aace8a30a9ebd9383b7d06042fb5a237c'; \
                 BINARY_URL='https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u191-b12/OpenJDK8U-jdk_aarch64_linux_hotspot_8u191b12.tar.gz'; \
                 ;; \
               *) \
                 echo "Unsupported arch: ${ARCH}"; \
                 exit 1; \
                 ;; \
            esac; \
            curl -Lso /tmp/openjdk.tar.gz ${BINARY_URL}; \
            sha256sum /tmp/openjdk.tar.gz; \
            sudo mkdir -p /opt/java/openjdk; \
            cd /opt/java/openjdk; \
            echo "${ESUM}  /tmp/openjdk.tar.gz" | sha256sum -c -; \
            sudo tar -xf /tmp/openjdk.tar.gz; \
            jdir=$(dirname $(dirname $(sudo find /opt/java/openjdk -name java | grep -v "/jre/bin"))); \
            sudo mv ${jdir}/* /opt/java/openjdk; \
            sudo rm -rf ${jdir} /tmp/openjdk.tar.gz;

        export  JAVA_HOME=/opt/java/openjdk \
                PATH="/opt/java/openjdk/bin:$PATH"
        export  JAVA_TOOL_OPTIONS=""
        export  LD_LIBRARY_PATH="$JAVA_HOME/jre/lib/amd64/server"

        ############################################
        #####          End JDK Install         #####
        ############################################
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
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" || ( echo "Error loading NVM " && exit 1 ) ; # This loads nvm
	
    if [[ -f $HOME/.bash_profile ]]; then
   		source $HOME/.bash_profile
    fi
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
