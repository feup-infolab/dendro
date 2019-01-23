FROM "ubuntu:18.04"

######    CONSTANTS    ######
ENV DENDRO_USER dendro
ENV HOME /home/${DENDRO_USER}
ENV NVM_DIR ${HOME}/.nvm
# ENV COMMIT_HASH 9496630f9cd0fd434655ddf2b527cad3020d9df3
ENV DENDRO_GITHUB_URL https://github.com/feup-infolab/dendro.git
ENV DENDRO_INSTALL_DIR /dendro/dendro_install
ENV DENDRO_RUNNING_DIR /dendro/dendro
ENV DENDRO_USER_GROUP dendro
######    END CONSTANTS    ######

# Prepare working directory
RUN useradd -m "$DENDRO_USER"
RUN usermod "$DENDRO_USER" -g "$DENDRO_USER_GROUP"

WORKDIR $HOME

RUN apt-get update

# Install preliminary dependencies
RUN apt-get -y -f install unzip devscripts autoconf automake libtool flex bison gperf gawk m4 make libssl-dev imagemagick subversion zip wget curl --fix-missing

# Install text extraction tools
RUN apt-get -y -f install poppler-utils antiword unrtf tesseract-ocr

# Install python 2.7
RUN apt-get -y -f install python2.7
RUN ln -s /usr/bin/python2.7 /usr/bin/python

# Install Java Oracle SDK 8
RUN apt-get install -y software-properties-common
RUN \
  echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections && \
  add-apt-repository -y ppa:webupd8team/java && \
  apt-get update && \
  apt-get install -y oracle-java8-installer && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /var/cache/oracle-jdk8-installer

# Set Java Oracle SDK 8 as default Java
RUN apt-get install oracle-java8-set-default

# Create install dir
RUN mkdir -p "$DENDRO_INSTALL_DIR" && chown "$DENDRO_USER:$DENDRO_USER_GROUP" "$DENDRO_INSTALL_DIR"

# Switch to dendro install dir
WORKDIR "$DENDRO_INSTALL_DIR"

# Switch to Dendro user
USER "$DENDRO_USER"

# install nvm
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
RUN ls -la $HOME/.nvm
RUN echo "Installing node..."
RUN export NVM_DIR="$HOME/.nvm"
RUN echo $NVM_DIR

# Install proper node version
COPY ./.nvmrc "$DENDRO_INSTALL_DIR"
RUN NODE_VERSION="$(cat $DENDRO_INSTALL_DIR/.nvmrc)" \
	&& echo "Installing node version: $NODE_VERSION... " \
	&& . $NVM_DIR/install.sh \
	&& nvm \
    && nvm install "$NODE_VERSION" \
    && nvm alias default $NODE_VERSION \
    && nvm use default
RUN echo "loaded NVM and Node version $NODE_VERSION."

# update npm (force 5.6.0 because of write after end issue: https://github.com/npm/npm/issues/19989)
RUN npm i -g npm@5.6.0
RUN chown -R "$(whoami)" "$HOME/.nvm"

# Install bower, gulp, grunt
RUN npm i -g grunt && npm install gulp-cli -g && npm install bower -g

# Install node dependencies in /tmp to use the Docker cache
# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json /tmp/package.json
RUN cd /tmp && npm install

# same for bower
COPY public/bower.json /tmp/public/bower.json
RUN cd /tmp/public && bower install

# Clone dendro into install dir
COPY --chown="dendro:dendro" . "$DENDRO_INSTALL_DIR"

# Copy dendro startup script and make 'docker' the active deployment config
COPY --chown="dendro:dendro" ./conf/scripts/docker/start_dendro_inside_docker.sh "$DENDRO_INSTALL_DIR/dendro.sh"
RUN cp "$DENDRO_INSTALL_DIR/conf/docker_deployment_config.yml" "$DENDRO_INSTALL_DIR/conf/active_deployment_config.yml"

# Set dendro execution script as executable
RUN chmod ugo+rx "$DENDRO_INSTALL_DIR/dendro.sh"

# Put compiled libraries in place
RUN mv -a /tmp/node_modules $DENDRO_INSTALL_DIR
RUN cp -a /tmp/public/bower_components $DENDRO_INSTALL_DIR


# Run grunt
RUN grunt


# Expose dendro running directory as a volume
VOLUME [ "$DENDRO_RUNNING_DIR"]

# Show contents of folders
RUN echo "Contents of Dendro install dir: $(ls -la $DENDRO_INSTALL_DIR)"
RUN echo "Contents of Dendro running dir: $(ls -la $DENDRO_RUNNING_DIR)"

# What is the active deployment config?
RUN echo "Contents of Dendro active configuration file: $(cat $DENDRO_INSTALL_DIR/conf/active_deployment_config.yml)"

# Start Dendro
CMD [ "/bin/bash", "$DENDRO_INSTALL_DIR/dendro.sh" ]
