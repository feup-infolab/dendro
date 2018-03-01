FROM tenforce/virtuoso:1.2.0-virtuoso7.2.4

RUN apt-get -y -qq install git

RUN rm -rf $HOME/dendro-install
RUN git clone https://github.com/feup-infolab/dendro-install.git $HOME/dendro-install

EXPOSE 8890

