FROM mongo:3.4.10

# install criu for container snapshotting and restoring
RUN apt-get -y -qq install git

RUN apt-get update
RUN apt-get install -y git protobuf-c-compiler libprotobuf-c0-dev protobuf-compiler libprotobuf-dev:amd64 gcc build-essential bsdmainutils python git-core asciidoc make htop git curl supervisor cgroup-lite libapparmor-dev libseccomp-dev libprotobuf-dev libprotobuf-c0-dev protobuf-c-compiler protobuf-compiler python-protobuf libnl-3-dev libcap-dev libaio-dev apparmor
RUN git clone https://github.com/xemul/criu.git criu
RUN cd criu
RUN make clean
RUN make
RUN make install


