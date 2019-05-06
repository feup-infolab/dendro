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
ENV NPM_TMP_DIR /tmp/npm

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
RUN apt-get -qq update
RUN apt-get -y -f -qq install sudo unzip devscripts autoconf automake libtool flex bison gperf gawk m4 make libssl-dev imagemagick subversion zip wget curl git rsync --fix-missing
RUN apt-get -y -qq install apt-utils --no-install-recommends

# Install text extraction tools
RUN apt-get -y -f -qq install poppler-utils antiword unrtf tesseract-ocr

# Install python 2.7
RUN apt-get -y -f -qq install python2.7
RUN ln -s /usr/bin/python2.7 /usr/bin/python

############################################
#####         Start JDK Install        #####
############################################

# Since there is no image of Ubuntu 19.04 at this time, I pasted from
# https://github.com/AdoptOpenJDK/openjdk-docker/blob/master/8/jdk/ubuntu/Dockerfile.hotspot.releases.full
RUN set -eux; \
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
    mkdir -p /opt/java/openjdk; \
    cd /opt/java/openjdk; \
    echo "${ESUM}  /tmp/openjdk.tar.gz" | sha256sum -c -; \
    tar -xf /tmp/openjdk.tar.gz; \
    jdir=$(dirname $(dirname $(find /opt/java/openjdk -name java | grep -v "/jre/bin"))); \
    mv ${jdir}/* /opt/java/openjdk; \
    rm -rf ${jdir} /tmp/openjdk.tar.gz;

ENV JAVA_HOME=/opt/java/openjdk \
    PATH="/opt/java/openjdk/bin:$PATH"
ENV JAVA_TOOL_OPTIONS=""
ENV LD_LIBRARY_PATH="$JAVA_HOME/jre/lib/amd64/server"

############################################
#####          End JDK Install         #####
############################################

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
RUN mkdir -p "$NPM_TMP_DIR"

# Install node dependencies in /tmp to use the Docker cache
# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
COPY ./package.json "$NPM_TMP_DIR"
WORKDIR "$NPM_TMP_DIR"
RUN cd "$NPM_TMP_DIR" && npm install
RUN echo "contents of $NPM_TMP_DIR"
RUN ls -la

# same for bower
COPY ./public/bower.json "$BOWER_TMP_DIR"
WORKDIR "$BOWER_TMP_DIR"
RUN cd "$BOWER_TMP_DIR" && bower install --allow-root
RUN echo "contents of $BOWER_TMP_DIR"
RUN ls -la


############################################
FROM app_libs_installed AS dendro_installed
############################################

# COPY dendro into install dir
COPY . "$DENDRO_INSTALL_DIR"
RUN ls -la "$DENDRO_INSTALL_DIR"

# Checkout specified DENDRO_GIT_BRANCH
# WORKDIR $DENDRO_INSTALL_DIR
# RUN git checkout "$DENDRO_GIT_BRANCH"
# RUN git pull

# Copy dendro startup script
COPY ./conf/scripts/docker/start_dendro_inside_docker.sh "$DENDRO_INSTALL_DIR/dendro.sh"

# Set dendro execution script as executable
RUN chmod ugo+rx "$DENDRO_INSTALL_DIR/dendro.sh"

# Put compiled libraries in place
RUN cp -R "$NPM_TMP_DIR/node_modules" "$DENDRO_INSTALL_DIR"
RUN cp -R "$BOWER_TMP_DIR/bower_components" "$DENDRO_INSTALL_DIR/public"

# Expose some of dendro running directory's subdirs as volumes
# VOLUME [ "$DENDRO_RUNNING_DIR/conf"]
# VOLUME [ "$DENDRO_RUNNING_DIR/logs"]
# VOLUME [ "$DENDRO_RUNNING_DIR/orchestras"]
# VOLUME [ "$DENDRO_RUNNING_DIR/profiling"]

# Show contents of folders
RUN echo "Contents of Dendro install dir are:"
RUN ls -la "$DENDRO_INSTALL_DIR"
# RUN echo "Contents of Dendro running dir are:"
# RUN ls -la "$DENDRO_RUNNING_DIR"

# What is the active deployment config?
RUN echo "Contents of Dendro active configuration file: $(cat $DENDRO_INSTALL_DIR/conf/active_deployment_config.yml)"

EXPOSE "$DENDRO_PORT"

# Start Dendro

CMD [ "/bin/bash", "/tmp/dendro/dendro.sh" ]
