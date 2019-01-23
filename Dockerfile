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
RUN apt-get -y -f install unzip devscripts autoconf automake libtool flex bison gperf gawk m4 make libssl-dev imagemagick subversion zip --fix-missing

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

VOLUME [ "$DENDRO_RUNNING_DIR"]

# create installation dir and make dendro user its owner
RUN mkdir -p "$DENDRO_INSTALL_DIR"

# Clone dendro into install dir
COPY --chown="dendro:dendro" . "$DENDRO_INSTALL_DIR"
RUN ls -la "$DENDRO_INSTALL_DIR"

# Copy dendro startup script and make 'docker' the active deployment config
COPY --chown="dendro:dendro" ./conf/scripts/docker/start_dendro_inside_docker.sh "$DENDRO_INSTALL_DIR/dendro.sh"
RUN rm "$DENDRO_INSTALL_DIR/conf/docker_deployment_config.yml" "$DENDRO_INSTALL_DIR/conf/active_deployment_config.yml"
RUN mv "$DENDRO_INSTALL_DIR/conf/docker_deployment_config.yml" "$DENDRO_INSTALL_DIR/conf/active_deployment_config.yml"

# What is the active deployment config?
RUN cat "$DENDRO_INSTALL_DIR/conf/active_deployment_config.yml"

# Set dendro execution script as executable
RUN chmod ugo+rx "$DENDRO_INSTALL_DIR/dendro.sh"

# Switch to Dendro user
USER "$DENDRO_USER"

# Run Dendro Installation
WORKDIR $DENDRO_INSTALL_DIR
RUN "$DENDRO_INSTALL_DIR/conf/scripts/install.sh"

# Start Dendro
CMD [ "/bin/bash", "/dendro/dendro/dendro.sh" ]
