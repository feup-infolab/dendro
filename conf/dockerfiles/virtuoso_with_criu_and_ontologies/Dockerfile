FROM tenforce/virtuoso:1.2.0-virtuoso7.2.4

# install criu for container snapshotting and restoring
RUN apt-get update
RUN apt-get install -y git wget
RUN apt-get install -y libprotobuf-dev libprotobuf-c0-dev protobuf-c-compiler protobuf-compiler python-protobuf libnl-3-dev libcap-dev
RUN apt-get install -y pkg-config python-ipaddr iproute2 libcap-dev libnet1-dev
RUN apt-get install -y asciidoc xmlto --no-install-recommends
RUN git clone https://github.com/checkpoint-restore/criu.git $HOME/criu
WORKDIR $HOME/criu
RUN apt-get install -y build-essential
RUN make -C $HOME/criu
RUN make install -C $HOME/criu

#load ontologies
RUN rm -rf $HOME/dendro-install
RUN git clone https://github.com/feup-infolab/dendro-install.git $HOME/dendro-install

# start virtuoso and load ontologies
RUN /bin/sh -c "/usr/local/virtuoso-opensource/bin/virtuoso-t -f -c /usr/local/virtuoso-opensource/var/lib/virtuoso/db/virtuoso.ini &" && sleep 20 && isql-v -U dba -P dba < $HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql

RUN which criu

EXPOSE 8890

