#!/usr/bin/env bash

VOLUME_DIR="/dendro"
INSTALL_DIR="/tmp/dendro"
RUNNING_DIR="$VOLUME_DIR/dendro"
NODE_VERSION="$(cat $INSTALL_DIR/.nvmrc)"

# Switch to dendro user to start the app instead of using root
HOME="/root"

echo "Dendro starting up at $RUNNING_DIR, installation dir $INSTALL_DIR and user $(whoami)"

echo "Contents of install dir.................."
ls -la $INSTALL_DIR
echo "Contents of running dir.................."
ls -la $RUNNING_DIR

if [[ ! -f $RUNNING_DIR ]]; then
	echo "Dendro running dir does not exist at $RUNNING_DIR, creating directory..."
	mkdir -p $RUNNING_DIR
	ls -la $VOLUME_DIR
fi

if [ -z "$(ls -A $RUNNING_DIR)" ]; then
	echo "Dendro running dir is empty, so we assume this is the first bootup of the container."
	echo "Copying all data from $INSTALL_DIR into $RUNNING_DIR..."
	cp -R $INSTALL_DIR/* $RUNNING_DIR
else
	echo "Dendro running directory ($RUNNING_DIR) is not empty, assuming it is already installed."
   	echo "Continuing startup..."
fi

# Change ownership 
echo "Contents of running dir $RUNNING_DIR"
ls -la $VOLUME_DIR

cd "$RUNNING_DIR" && echo "Switched to folder $(pwd) to start Dendro..." || exit "Unable to find directory $RUNNING_DIR"

. $HOME/.nvm/nvm.sh
nvm use --delete-prefix "$RUNNING_DIR"
nvm alias default "$(cat $RUNNING_DIR/.nvmrc)"
node src/app.js --config="docker"
