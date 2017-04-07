[![Build Status](http://buildserver-rdm.up.pt:8111/job/dendro/job/master/badge/icon)](http://buildserver-rdm.up.pt:8111/job/dendro/job/master/)
[![codecov](https://codecov.io/gh/feup-infolab/dendro/branch/master/graph/badge.svg)](https://codecov.io/gh/feup-infolab/dendro)
[![dependencies](https://david-dm.org/feup-infolab/dendro.svg)](https://david-dm.org/feup-infolab/dendro)
[![Code Climate](https://codeclimate.com/github/feup-infolab/dendro/badges/gpa.svg)](https://codeclimate.com/github/feup-infolab/dendro)
[![Issue Count](https://codeclimate.com/github/feup-infolab/dendro/badges/issue_count.svg)](https://codeclimate.com/github/feup-infolab/dendro)

#	Welcome to Dendro

![dendro UI](https://raw.githubusercontent.com/feup-infolab/dendro/master/public/images/Screen%20Shot%202017-04-04%20at%2012.22.08.png "Dendro UI")

## Demo instance

[DEMO](http://dendro.fe.up.pt/demo)

If it is down, please file an [issue](https://github.com/feup-infolab-rdm/dendro/issues/new).

## How to install

[Installation](https://github.com/feup-infolab/dendro-install)

## What is Dendro?

The Dendro platform is a completely open-source platform designed to help researchers describe their datasets, fully build on Linked Open Data. It is designed to capture data and metadata during the research workflow. Whenever researchers want to publish a dataset, they can export to repositories such as [CKAN](http://ckan.org/), [DSpace](http://www.dspace.org/), [Invenio](http://invenio-software.org/), or [EUDAT's B2Share](https://www.eudat.eu/services/b2share). Any repository can be added by writing small plug-ins.

It is under development at [Faculdade de Engenharia da Universidade do Porto](https://www.fe.up.pt/)'s [Infolab](http://infolab.fe.up.pt) since 2013. If you are interested in the academic foundations and innovations behind Dendro, please check out our **publications** at the [Dendro official website](http://dendro.fe.up.pt).


You are free to use Dendro to build any service for your research group or institution.

Pull requests are welcome!

## Dependencies

Dendro relies on

* OpenLink Virtuoso for the database layer
* ElasticSearch for free text searching
* MongoDB and its GridFS system for scalable file storage
* NodeJS and ExpressJS for the server side
* Twitter Boostrap
* [![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](https://gruntjs.com/)

##Acknowledgements

This work was supported by project NORTE-07-0124-FEDER-000059, financed by the North Portugal Regional Operational Programme (ON.2-O Novo Norte), under the National Strategic Reference Framework (NSRF), through the European Regional Development Fund (ERDF), and by national funds, through the Portuguese funding agency, Fundação para a Ciência e a Tecnologia (FCT). João Rocha da Silva was also supported by research grant SFRH/BD/77092/2011, provided by the Portuguese funding agency, Fundação para a Ciência e a Tecnologia (FCT).

This work is financed by the ERDF – European Regional Development Fund through the Operational Programme for Competitiveness and Internationalisation - COMPETE 2020 Programme and by National Funds through the Portuguese funding agency, FCT - Fundação para a Ciência e a Tecnologia within project POCI-01-0145-FEDER-016736.

<img src="https://github.com/feup-infolab-rdm/dendro-install/raw/master/logos.jpg">

## License

[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

All source code is freely available under a standard [BSD 3-Clause license](https://opensource.org/licenses/BSD-3-Clause).

Copyright (c) 2016, João Rocha da Silva, FEUP InfoLab (http://dendro.fe.up.pt)

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
