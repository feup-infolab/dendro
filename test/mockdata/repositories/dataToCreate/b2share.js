/*
 {
 "ddr":{"hasExternalUrl":"trng-b2share.eudat.eu","hasAccessToken":"MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/b2share","dcterms":{"title":"EUDAT B2Share","description":"A EUDAT B2Share deposition"},
 "foaf":{"nick":"b2share","homepage":"https://b2share.eudat.eu/"},
 "$$hashKey":"object:146"}},
 "dcterms":{"title":"b2share config 2"}
 }*/

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
/*const newExportRepoData = {
    ddr: {
        hasExternalUrl: "trng-b2share.eudat.eu",
        hasAccessToken: "MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE",
        hasPlatform: {
            uri: "http://127.0.0.1:3001/repository_platform/b2share",
            dcterms: {title: "EUDAT B2Share", description: "A EUDAT B2Share deposition"},
            foaf: {nick: "b2share", homepage: "https://b2share.eudat.eu/"},
            $$hashKey: "object:146"
        }
    },
    dcterms: {title: "b2share config 2"}
};*/

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const newExportRepoData = {
    dcterms:{
        title:"b2share_config_2"
    },
    ddr:{
        hasExternalUrl:"trng-b2share.eudat.eu",
        hasAccessToken: "MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE",
        hasPlatform:{
            uri:"/r/repo_platform/14a5d3e5-2654-4918-ba7e-d7230cf2a294",
            foaf:{
                homepage:"https://b2share.eudat.eu/",
                nick:"b2share"
            },
            dcterms:{
                title:"B2SHARE"
            },
            ddr:{
                handle:"b2share",
                created:"2017-10-02T12:17:04.105Z",
                modified:"2017-10-02T12:17:04.106Z",
                humanReadableURI:"http://" + Config.host +"/repository_platform/b2share"
            },
            rdf:{
                type:[
                    "http://dendro.fe.up.pt/ontology/0.1/RepositoryPlatform",
                    "http://dendro.fe.up.pt/ontology/0.1/Resource"
                ]
            },
            types:{

            },
            schema:{

            },
            nie:{

            },
            nfo:{

            },
            research:{

            },
            dcb:{

            },
            achem:{

            },
            bdv:{

            },
            tsim:{

            },
            biocn:{

            },
            grav:{

            },
            hdg:{

            },
            cep:{

            },
            social:{

            },
            cfd:{

            },
            tvu:{

            },
            po:{

            },
            $$hashKey:"object:146"
        }
    }
};

module.exports = newExportRepoData;