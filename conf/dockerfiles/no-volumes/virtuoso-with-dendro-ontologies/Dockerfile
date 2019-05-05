FROM feupinfolab/virtuoso-no-volumes:latest

#iproute2
SHELL ["/bin/bash", "-c"]

RUN chmod +x /virtuoso.sh
RUN ln -s /usr/local/virtuoso-opensource/bin/isql-v /usr/local/virtuoso-opensource/bin/isql
RUN mkdir /database

RUN apt-get update; apt-get -y -qq install curl netcat git iptables
ARG DBA_PASSWORD="mysecret"

ENV SCRIPTS_LOCATION="/startup"
COPY ./startup "$SCRIPTS_LOCATION"

RUN git clone https://github.com/feup-infolab/dendro-ontologies.git /usr/share/proj/dendro-ontologies

# Environment variables

ENV ORIGINAL_VIRTUOSO_STARTUP_SCRIPT "/virtuoso.sh"
ENV VIRTUOSO_DBA_USER "dba"
ENV DBA_PASSWORD "$DBA_PASSWORD"
ENV SETUP_COMPLETED_PREVIOUSLY "/database/virtuoso_already_loaded_ontologies.dat"

ENTRYPOINT ["/bin/bash", "-c", "/startup/scripts/virtuoso.sh"]
