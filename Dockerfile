FROM "ubuntu:18.04"

######    CONSTANTS    ######
ENV DENDRO_USER dendro
ENV HOME /home/${DENDRO_USER}
ENV NVM_DIR ${HOME}/.nvm
# ENV COMMIT_HASH 9496630f9cd0fd434655ddf2b527cad3020d9df3
ENV DENDRO_GITHUB_URL https://github.com/feup-infolab/dendro.git
ENV DENDRO_INSTALL_DIR /dendro/dendro
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

# create installation dir and make dendro user its owner
RUN mkdir -p "$DENDRO_INSTALL_DIR"

# Clone dendro into install dir
COPY . "$DENDRO_INSTALL_DIR"
RUN ls "$DENDRO_INSTALL_DIR"

# Copy dendro startup script
COPY ./conf/scripts/docker/start_dendro_inside_docker.sh "$DENDRO_INSTALL_DIR/dendro.sh"

# Set permissions on installation folder
USER root
RUN chown -R "$DENDRO_USER":"$DENDRO_USER_GROUP" "$DENDRO_INSTALL_DIR"
RUN chmod 0777 "$DENDRO_INSTALL_DIR/dendro.sh"

# Run Dendro Installation
USER "$DENDRO_USER"
WORKDIR $DENDRO_INSTALL_DIR
RUN "$DENDRO_INSTALL_DIR/conf/scripts/install.sh"

# Set permissions on installation folder (again)
USER root

# Make 'docker' the active deployment config
COPY conf/scripts/docker_deployment_config.yml "$DENDRO_INSTALL_DIR/conf/active_deployment_config.yml"

RUN chown -R "$DENDRO_USER":"$DENDRO_USER_GROUP" "$DENDRO_INSTALL_DIR"
RUN chmod 0777 "$DENDRO_INSTALL_DIR/dendro.sh"

# Get contents of finalized dendro install directory (debug)
# RUN ls -la "$DENDRO_INSTALL_DIR"

# Run Dendro
USER "$DENDRO_USER"
WORKDIR $DENDRO_INSTALL_DIR
# RUN $DENDRO_INSTALL_DIR/dendro.sh

# Start Dendro
CMD [ "/bin/bash", "/dendro/dendro/dendro.sh" ]
