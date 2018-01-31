FROM tenforce/virtuoso:1.2.0-virtuoso7.2.4

# install criu for container snapshotting and restoring
RUN apt-get update
RUN apt-get install -y git protobuf-c-compiler libprotobuf-c0-dev protobuf-compiler libprotobuf-dev:amd64 gcc build-essential bsdmainutils python git-core asciidoc make htop git curl supervisor cgroup-lite libapparmor-dev libseccomp-dev libprotobuf-dev libprotobuf-c0-dev protobuf-c-compiler protobuf-compiler python-protobuf libnl-3-dev libcap-dev libaio-dev apparmor
RUN git clone https://github.com/xemul/criu.git criu
RUN cd criu
RUN make clean
RUN make
RUN make install

#sleep 15 seconds to allow virtuoso to come online before loading ontologies
RUN sleep 15

#load ontologies
RUN rm -rf $HOME/dendro-install
RUN git clone https://github.com/feup-infolab/dendro-install.git $HOME/dendro-install
RUN isql-v -U dba -P dba < \$HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql

EXPOSE 8890

