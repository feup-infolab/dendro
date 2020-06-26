#!/bin/bash

die()
{
	echo "$1" &&
	exit 1
}


DENDRO_SETUP_SCRIPTS_PATH="/home/jrocha/dendro-install"
DENDRO_INSTALLATION_PATH="/dendro/dendro_prd_demo_3007_port"

START_DIR=$(pwd)


cd "$DENDRO_SETUP_SCRIPTS_PATH"
LATEST_DENDRO_INSTALL_SHA=$(git ls-remote git://github.com/feup-infolab/dendro-install.git --heads master | cut -c 1-40)
CURRENT_DENDRO_INSTALL_SHA=$(git log -1 | grep "commit.*" | cut -c 8- | tr -d "\n")


cd "$DENDRO_INSTALLATION_PATH"
LATEST_DENDRO_SHA=$(git ls-remote git://github.com/feup-infolab/dendro.git --heads master | cut -c 1-40)
CURRENT_DENDRO_SHA=$(git log -1 | grep "commit.*" | cut -c 8- | tr -d "\n")

if [ "$LATEST_DENDRO_SHA " != "$CURRENT_DENDRO_SHA" ]
then
	DENDRO_NEEDS_TO_BE_UPDATED="1"
else
	DENDRO_NEEDS_TO_BE_UPDATED="0"
fi


if [ "$LATEST_DENDRO_INSTALL_SHA " != "$CURRENT_DENDRO_INSTALL_SHA" ]
then
        DENDRO_INSTALL_NEEDS_TO_BE_UPDATED="1"
else
        DENDRO_INSTALL_NEEDS_TO_BE_UPDATED="0"
fi

#############################

if [ "$DENDRO_INSTALL_NEEDS_TO_BE_UPDATED" ]
then
	cd "$DENDRO_SETUP_SCRIPTS_PATH" &&
	git stash &&
	git pull --no-edit &&
	git stash apply &&
	echo "Dendro Install Scripts updated successfully" || die "Unable to update dendro install scripts"
fi

if [ "$DENDRO_NEEDS_TO_BE_UPDATED" ]
then
        cd "$DENDRO_SETUP_SCRIPTS_PATH/scripts" &&
	echo "I am at diretory $(pwd)" &&
	./install.sh -r &&
        echo "Dendro Install Scripts updated successfully" || die "Unable to update dendro install scripts"
fi
