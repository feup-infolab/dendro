############################################
FROM "ubuntu:19.04" as base
############################################

######    BUILD ARGUMENTS    ######

ARG SOURCE_BRANCH=master

######    CONSTANTS    ######
ENV DENDRO_GITHUB_URL https://github.com/feup-infolab/dendro.git
ENV DENDRO_GIT_BRANCH "$SOURCE_BRANCH"
ENV DENDRO_INSTALL_DIR /tmp/dendro
ENV DENDRO_RUNNING_DIR /dendro
ENV DENDRO_PORT 3001

ENV HOME /root
ENV NVM_DIR /root/.nvm

ENV BOWER_TMP_DIR /tmp/public

ENV NODE_VERSION v8.10.0
#####    END CONSTANTS    ######

# Change shell to bash
SHELL ["/bin/bash", "-c"]

RUN mkdir -p "$NVM_DIR"
USER root

############################################
FROM base AS dependencies
############################################

# Install preliminary dependencies
RUN apt-get update
RUN apt-get -y -f -qq install sudo unzip devscripts autoconf automake libtool flex bison gperf gawk m4 make libssl-dev imagemagick subversion zip wget curl git rsync --fix-missing
RUN apt-get -y -qq install apt-utils --no-install-recommends

# Install text extraction tools
RUN apt-get -y -f -qq install poppler-utils antiword unrtf tesseract-ocr

# Install python 2.7
RUN apt-get -y -f -qq install python2.7
RUN ln -s /usr/bin/python2.7 /usr/bin/python

# Install Java Oracle SDK 8
RUN apt-get install -y -qq software-properties-common
RUN \
  echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | debconf-set-selections && \
  add-apt-repository -y ppa:webupd8team/java && \
  apt-get -qq update && \
  apt-get -y -qq install oracle-java8-installer && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /var/cache/oracle-jdk8-installer

# Set Java Oracle SDK 8 as default Java
RUN apt-get install -y -qq oracle-java8-set-default

# compatibility fix for node on ubuntu
RUN ln -s /usr/bin/nodejs /usr/bin/node

############################################
FROM dependencies as nvm_installed
############################################

# Install NVM
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" \
	&& nvm install $NODE_VERSION \
	&& nvm use --delete-prefix $NODE_VERSION \
	&& nvm alias default $NODE_VERSION

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

############################################
FROM nvm_installed as global_npms
############################################

# update npm (force 5.6.0 because of "write after end" issue: https://github.com/npm/npm/issues/19989)
# Install bower, gulp, grunt
RUN npm i -g npm@5.6.0 \
	&& npm i -g grunt@1.0.3 \
	&& npm i -g gulp-cli@2.0.1 \
	&& npm i -g bower@1.8.8

############################################
FROM global_npms as app_libs_installed
############################################

#create temporary librarry directories as root
RUN mkdir -p "$BOWER_TMP_DIR"

# Switch to dendro install dir
WORKDIR $DENDRO_INSTALL_DIR

# Install node dependencies in /tmp to use the Docker cache
# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY package.json /tmp/package.json
RUN cd /tmp && npm install

# same for bower
COPY ./public/bower.json "$BOWER_TMP_DIR"
RUN cd "$BOWER_TMP_DIR" && bower install --allow-root

############################################
FROM app_libs_installed AS dendro_installed
############################################

# COPY dendro into install dir
COPY . "$DENDRO_INSTALL_DIR"
RUN ls -la "$DENDRO_INSTALL_DIR"

# Checkout specified DENDRO_GIT_BRANCH
WORKDIR $DENDRO_INSTALL_DIR
RUN git checkout "$DENDRO_GIT_BRANCH"
RUN git pull

# Copy dendro startup script
COPY ./conf/scripts/docker/start_dendro_inside_docker.sh "$DENDRO_INSTALL_DIR/dendro.sh"

# Set dendro execution script as executable
RUN chmod ugo+rx "$DENDRO_INSTALL_DIR/dendro.sh"

# Put compiled libraries in place
RUN cp -R /tmp/node_modules "$DENDRO_INSTALL_DIR"
RUN cp -R "$BOWER_TMP_DIR/bower_components" "$DENDRO_INSTALL_DIR/public"

# Expose dendro running directory as a volume
VOLUME [ "$DENDRO_RUNNING_DIR"]

# Show contents of folders
RUN echo "Contents of Dendro install dir are:"
RUN ls -la "$DENDRO_INSTALL_DIR"
RUN echo "Contents of Dendro running dir are:"
RUN ls -la "$DENDRO_RUNNING_DIR"

# What is the active deployment config?
RUN echo "Contents of Dendro active configuration file: $(cat $DENDRO_INSTALL_DIR/conf/active_deployment_config.yml)"

EXPOSE "$DENDRO_PORT"

# Start Dendro

CMD [ "/bin/bash", "/tmp/dendro/dendro.sh" ]
