FROM elasticsearch:2.3.3

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

EXPOSE 9200
