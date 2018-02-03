FROM tenforce/virtuoso:1.2.0-virtuoso7.2.4

#load ontologies

# start virtuoso and load ontologies
ARG CACHEBUST1=1
RUN rm -rf $HOME/dendro-install
RUN git clone https://github.com/feup-infolab/dendro-install.git $HOME/dendro-install

RUN /bin/sh -c "virtuoso-t -f &" && \
    sleep 30 && \
    isql-v -U "dba" -P "dba" < $HOME/dendro-install/scripts/SQLCommands/interactive_sql_commands.sql && \
    echo "shutdown();" | isql-v -U "dba" -P "dba"

EXPOSE 8890
EXPOSE 1111

