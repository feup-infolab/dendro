#!/usr/bin/env bash
dendro_installation_path='/dendro'
user_name='dendro'
temp_downloads_folder='/tmp/dendro_setup'
dendro_svn_url='https://dendro-dev.fe.up.pt/svn/dendro/'
dendro_startup_item_file='/etc/init/dendro.conf'
dendro_log_file_path='/var/log/dendro.log'
active_deployment_setting='prd-dendro-prd'

#create user
sudo adduser $user_name
sudo adduser $user_name sudo
sudo apt-get -y install autoconf automake libtool flex bison gperf gawk m4 make libssl-dev git imagemagick git subversion

#create temp downloads folder
sudo mkdir $temp_downloads_folder

#install virtuoso opensource 7
cd $temp_downloads_folder
rm -rf virtuoso-opensource
sudo git clone https://github.com/openlink/virtuoso-opensource.git virtuoso-opensource
sudo chmod 0777 virtuoso-opensource
cd virtuoso-opensource
sudo git branch remotes/origin/stable/7
sudo ./autogen.sh
sudo CFLAGS="-O2 -m64"
sudo export CFLAGS
sudo ./configure
sudo make
sudo make install
sudo /usr/local/virtuoso-opensource/bin/virtuoso-t -f -c /usr/local/virtuoso-opensource/var/lib/virtuoso/db/virtuoso.ini
sudo apt-get update && sudo apt-get -y install git-core curl build-essential openssl libssl-dev

printf "Now install your ontologies in virtuoso. It should be accessible at this machine, on port 9200 (default config). Press ENTER to continue."
read dummy
printf "Open the interactive SQL editor in Virtuoso, paste the following, and run the query:"
printf ""
printf ""
printf "SPARQL LOAD <http://www.w3.org/ns/auth/cert#> INTO graph <http://www.w3.org/ns/auth/cert#>;
SPARQL LOAD <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo> INTO graph <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>;
SPARQL LOAD <http://dublincore.org/2012/06/14/dcelements.rdf>  INTO graph <http://purl.org/dc/elements/1.1/>;
SPARQL LOAD <http://dublincore.org/2012/06/14/dcterms.rdf> INTO GRAPH <http://purl.org/dc/terms/>;
SPARQL LOAD <http://www.semanticdesktop.org/ontologies/2007/01/19/nie> INTO graph <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>;
SPARQL LOAD <http://joaorosilva.no-ip.org/public/dendro/dendro.owl> INTO GRAPH <http://dendro.fe.up.pt/ontology/0.1/>;
SPARQL LOAD <http://xmlns.com/foaf/spec/INDEX.rdf> INTO GRAPH <http://xmlns.com/foaf/0.1/>
SPARQL LOAD <http://joaorosilva.no-ip.org/public/dendro/ontologies/EcoGeorref.owl> INTO <http://dendro.fe.up.pt/ontology/EcoGeorref/0.1>
SPARQL LOAD <http://joaorosilva.no-ip.org/public/dendro/ontologies/research.owl> INTO GRAPH <http://dendro.fe.up.pt/ontology/research/>;
SPARQL LOAD <http://joaorosilva.no-ip.org/public/dendro/ontologies/achem.owl> INTO GRAPH <http://dendro.fe.up.pt/ontology/achem/>;
SPARQL LOAD <http://joaorosilva.no-ip.org/public/dendro/ontologies/dcb.owl> INTO GRAPH <http://dendro.fe.up.pt/ontology/dcb/>"
printf ""
printf ""

printf "Now setup the namespaces in Virtuoso. Open the Linked Data tab, select Namespaces, and add all these. Press ENTER to start."
read dummy
printf ""
printf "bdv - http://dendro.fe.up.pt/ontology/BIODIV/0.1#"
printf "dc - http://purl.org/dc/elements/1.1/"
printf "dcb - http://dendro.fe.up.pt/ontology/dcb/"
printf "dcterms - http://purl.org/dc/terms/"
printf "ddr - http://dendro.fe.up.pt/ontology/0.1/"
printf "foaf - http://xmlns.com/foaf/0.1/"
printf "nfo - http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#"
printf "nie - http://www.semanticdesktop.org/ontologies/2007/01/19/nie#"
printf "void - http://rdfs.org/ns/void#"
printf ""
printf "Done?. Press ENTER to continue."
read dummy

#install nodejs
sudo cd $temp_downloads_folder
sudo git clone https://github.com/joyent/node.git
sudo cd node
sudo git checkout v0.10.28
sudo ./configure --openssl-libpath=/usr/lib/ssl
sudo make
sudo make install

#install elasticsearch
sudo cd $temp_downloads_folder
sudo apt-get -f install
sudo apt-get -y install openjdk-7-jre-headless openjdk-7-jre
sudo wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.0.deb
sudo dpkg -i elasticsearch-0.90.0.deb
sudo service elasticsearch start

#install mongodb 10g
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-get update
sudo apt-get -y install -f mongodb-10gen
sudo apt-get autoremove
sudo rm -rf $temp_downloads_folder

#check out dendro code from svn repo
sudo rm -rf $dendro_installation_path
sudo svn export $dendro_svn_url $dendro_installation_path

#set active deployment configuration
sudo cd $dendro_installation_path
sudo echo "{\"key\" : \"${active_deployment_setting}\"}" > deployment/active_deployment_config.json

#setup auto-start dendro service
sudo rm $dendro_startup_item_file
sudo touch $dendro_startup_item_file
sudo touch $dendro_log_file_path

echo 'description "node.js server"
author      "kvz - http://kevin.vanzonneveld.net"

# used to be: start on startup
# until we found some mounts werent ready yet while booting:
start on runlevel [2345]
stop on shutdown

# Automatically Respawn:
respawn
#respawn limit 99 5

script
    # Not sure why $HOME is needed, but we found that it is:
    export HOME="/root"

    exec /usr/local/bin/node ${dendro_installation_path}/app.js >> ${dendro_log_file_path} 2>&1
end script

post-start script
   # Optionally put a script here that will notifiy you node has (re)started
   # /root/bin/hoptoad.sh "node.js has started!"
end script' > $dendro_startup_item_file

#start dendro service
sudo service dendro start
