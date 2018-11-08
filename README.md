## Build Statuses

UPDigital Server [![Build Status](http://buildserver-rdm.up.pt:8111/job/Dendro/job/dendro/job/post-ranking/badge/icon)](http://buildserver-rdm.up.pt:8111/job/Dendro/job/dendro/job/post-ranking/) Travis [![Build Status](https://travis-ci.org/feup-infolab/dendro.svg?branch=master)](https://travis-ci.org/feup-infolab/dendro)

## Code Quality
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/28789e8562c4460280710d730bd65ca0)](https://www.codacy.com/app/silvae86/dendro?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=feup-infolab/dendro&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/28789e8562c4460280710d730bd65ca0)](https://www.codacy.com/app/silvae86/dendro?utm_source=github.com&utm_medium=referral&utm_content=feup-infolab/dendro&utm_campaign=Badge_Coverage)
[![dependencies](https://david-dm.org/feup-infolab/dendro.svg)](https://david-dm.org/feup-infolab/dendro)
[![Chat on gitter](https://img.shields.io/gitter/room/badges/shields.svg)](https://gitter.im/feup-infolab/dendro)
[![](https://images.microbadger.com/badges/version/joaorosilva/dendro:master.svg)](https://microbadger.com/images/joaorosilva/dendro:master "Get your own version badge on microbadger.com")

## What is Dendro?

Dendro is the software powering [INESC TEC](https://dendro.inesctec.pt) and the [University of Porto](https://dendro-rdm.up.pt) data staging platforms. It allows researchers to manage research data in preparation for deposit in any research data repository. "Upload files and fill in metadata once, deposit anywhere you like".

## The user interface

![dendro UI](https://raw.githubusercontent.com/feup-infolab/dendro/master/public/images/Screen%20Shot%202017-04-04%20at%2012.22.08.png "Dendro UI")

## How to install

We offer three alternatives for installation: 1. Docker image (fast and easy) 2. Local code, dependencies as Docker containers (for developers) and 3. Installation using bash scripts and Vagrant (useful if you need a Virtual Machine running Dendro

### 1. Docker containers (for end-users)

To install Dendro using Docker, do the following:

1. Install [Docker](https://docs.docker.com/docker-for-windows/install/)
2. Open a Terminal window on Linux/Mac or press Ctrl+R on Windows, type cmd.exe in the box that appears and press Enter
3. Clone the Dendro Docker installation repository by pasting this code
````bash
git clone https://github.com/feup-infolab/dendro-install-docker dendro-install-docker
````
4. Run the installation command in the same terminal and wait until no more text is printed. It can take several minutes.
````bash
cd dendro-install-docker
docker-compose up
````
5. Access your dendro installation at [127.0.0.1:3001](http://127.0.0.1:3001) in your browser.
6. When you want to stop Dendro, just press Ctrl+C at the terminal window

We provide a [Docker image](https://hub.docker.com/r/joaorosilva/dendro/) for getting you up and running quickly. For deployment in a production server, however, we recommend you use the Dendro install scripts.

### 2. Code in local folder, databases running as Docker containers (for development)

If you just want to download dendro and start developing, Dendro now supports automatic deployment using Docker containers for all dependencies (MySQL, Virtuoso and ElasticSearch). This only works for Mac and Linux machines (for now).

1. Install Docker

Here is the "just copy and paste" installations script for Docker in Ubuntu. Enjoy.

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

# Add Docker repo
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce

# Start Docker Daemon
sudo service docker start

# Add yourself to the Docker user group, otherwise docker will complain that
# it does not know if the Docker Daemon is running
sudo usermod -aG docker ${USER}

# Install docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
source ~/.bashrc
docker-compose --version
echo "Done!"
```

2. Open a Terminal window on Linux/Mac
3. Clone the Dendro Docker installation repository by pasting this code
````bash
git clone https://github.com/feup-infolab/dendro dendro
````
4. Run the installation command in the same terminal and wait until no more text is printed. It can take several minutes.
````bash
cd dendro
./conf/scripts/install.sh
````
5. Start the app
````bash
npm start
````
6. Access Dendro at `http://127.0.0.1:3001`
7. Start developing :-)

### 3. Installation scripts for production machines (Advanced)

[Installation scripts for production machines](https://github.com/feup-infolab/dendro-install) (this is recommended for IT professionals). 

These scripts can be used not only to build a Virtual Machine that boots Dendro using Vagrant but also to set up an Ubuntu-powered production machine.

## Description

Dendro is a collaborative file storage and description platform designed to support users in collecting and describing data, with its roots in research data management. It does not intend to replace existing research data repositories, because it is placed before the moment of deposit in a data repository. 

It is designed to support the work of research groups with collaborative features such as: 

 - File metadata versioning
 - Permissions management
 - Editing and rollback
 - Public/Private/Metadata Only project visibility

You start by creating a “Project”, which is like a Dropbox shared folder. Projects can be private (completely invisible to non-colaborators), metadata-only (only metadata is visible but data is not), and public (everyone can read both data and metadata). Project members can then upload files and folders and describe those resources using domain-specific and generic metadata, so it can suit a broad spectrum of data description needs. The contents of some files that contain data (Excel, CSV, for example) is automatically extracted, as well as text from others (PDF, Word, TXT, etc) to assist discovery. 

Dendro provides a flexible data description framework built on Linked Open Data at the core (triple store as), scalable file storage for handling big files, BagIt-represented backups, authentication with [ORCID](https://orcid.org/) and sharing to practically any repository platform. Currently we support the following repositories:

 - [CKAN](http://ckan.org/)
 - [DSpace](http://www.dspace.org/)
 - [Invenio](http://invenio-software.org/)
 - [EUDAT's B2Share](https://www.eudat.eu/services/b2share),
 - [Figshare](https://figshare.com/). 
 - Any repository can be added by writing small plug-ins.
 
We are also implementing an altmetrics module and a soclal extension that can help project members keep track of the changes made in the project.

The software will be a core component of the [UPorto](https://sigarra.up.pt/up/pt/web_base.gera_pagina?p_pagina=home) and [INESC-TEC](https://www.inesctec.pt/) Research Data Management workflow by 2018 as per the TAIL project, funded by the Portuguese FCT (Fundação para a Ciência e Tecnologia). As such, we are working hard to make it production-ready. This means writing extensive automatic tests which complement the existing usage tests with actual researchers. 

The code is freely available online and we welcome more user testing scenarios, user feedback and development contributions. You are free to use Dendro to build any service for your research group or institution and pull requests are welcome.

## Demo instance

[DEMO](http://dendro.fe.up.pt/demo)

If it is down, please file an [issue](https://github.com/feup-infolab-rdm/dendro/issues/new).

## Who is building Dendro?

Dendro is being built by [Faculdade de Engenharia da Universidade do Porto](https://www.fe.up.pt/)'s [Infolab](http://infolab.fe.up.pt) since 2013. If you are interested in the academic foundations and innovations behind Dendro, please check out our **publications** at the [Dendro official website](http://dendro.fe.up.pt).

## Dependencies

Dendro relies on

* OpenLink Virtuoso for the database layer
* ElasticSearch for free text searching
* MongoDB and its GridFS system for scalable file storage
* NodeJS and ExpressJS for the server side
* Twitter Boostrap
* [![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](https://gruntjs.com/)

## Acknowledgements

This work was supported by project NORTE-07-0124-FEDER-000059, financed by the North Portugal Regional Operational Programme (ON.2-O Novo Norte), under the National Strategic Reference Framework (NSRF), through the European Regional Development Fund (ERDF), and by national funds, through the Portuguese funding agency, Fundação para a Ciência e a Tecnologia (FCT). João Rocha da Silva was also supported by research grant SFRH/BD/77092/2011, provided by the Portuguese funding agency, Fundação para a Ciência e a Tecnologia (FCT).

This work is financed by the ERDF – European Regional Development Fund through the Operational Programme for Competitiveness and Internationalisation - COMPETE 2020 Programme and by National Funds through the Portuguese funding agency, FCT - Fundação para a Ciência e a Tecnologia within project POCI-01-0145-FEDER-016736.

<img src="https://github.com/feup-infolab-rdm/dendro-install/raw/master/logos.jpg">

## License

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

All source code is freely available under a standard [BSD 3-Clause license](https://opensource.org/licenses/BSD-3-Clause).

Copyright (c) 2016, FEUP InfoLab (http://dendro.fe.up.pt)

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
