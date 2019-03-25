#!/usr/bin/env bash

function copy_source_to_destination()
{
  local source_dir=$1
  local running_dir=$2

  # diff -r -q "$source_dir" "$running_dir"

  echo "Copying files..."

  diff -q "$source_dir" "$running_dir"
  rsync --quiet --recursive "$source_dir"/ "$running_dir"/
}

# Switch to dendro user to start the app instead of using root
HOME="/root"

echo "Dendro starting up at $DENDRO_RUNNING_DIR, installation dir $DENDRO_INSTALL_DIR and user $(whoami)"

echo "Contents of install dir.................."
ls -la "$DENDRO_INSTALL_DIR"
echo "Contents of running dir.................."
ls -la "$DENDRO_RUNNING_DIR"

MAIN_SOURCE_FILE="$DENDRO_RUNNING_DIR/src/app.js"
if [ ! -f "$MAIN_SOURCE_FILE" ]; then
	echo "Dendro main source file is NOT PRESENT at $MAIN_SOURCE_FILE, so we assume this is the first bootup of the container."
	echo "Copying all data from $DENDRO_INSTALL_DIR into $DENDRO_RUNNING_DIR..."
  copy_source_to_destination "$DENDRO_INSTALL_DIR" "$DENDRO_RUNNING_DIR"
else
	echo "Dendro main source file ($MAIN_SOURCE_FILE) exists, assuming it is already installed."
fi

echo "Contents of running dir $DENDRO_RUNNING_DIR"
ls -la $DENDRO_RUNNING_DIR

cd "$DENDRO_RUNNING_DIR" && echo "Switched to folder $(pwd) to start Dendro..." \
  || ( echo "Unable to find directory $DENDRO_RUNNING_DIR" && exit 1 )

. $HOME/.nvm/nvm.sh
nvm use --delete-prefix "$DENDRO_RUNNING_DIR"
nvm alias default "$(cat $DENDRO_RUNNING_DIR/.nvmrc)"

if [[ "$DENDRO_ACTIVE_DEPLOYMENT_CONFIG" == "" ]]; then
    DENDRO_ACTIVE_DEPLOYMENT_CONFIG="docker"
fi

node src/app.js --config="$DENDRO_ACTIVE_DEPLOYMENT_CONFIG"

if [[ "$?" != "0" ]];
then
  echo "There was an error starting or running dendro!"
  exit 1
  # echo "Showing the contents of $DENDRO_INSTALL_DIR and $(pwd)..."
  # printf "$DENDRO_INSTALL_DIR\n"
  # ls "$DENDRO_INSTALL_DIR"
  #
  # printf "$(pwd)\n"
  # ls "$(pwd)"
  #
  # echo "Trying to copy again all contents of install dir $DENDRO_DENDRO_INSTALL_DIR to running idr $DENDRO_RUNNING_DIR"
  # copy_source_to_destination "$DENDRO_INSTALL_DIR" "$DENDRO_RUNNING_DIR"
fi
