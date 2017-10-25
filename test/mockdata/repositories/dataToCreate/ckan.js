/*
 {"dcterms":{"title":"ckan export config 1"},"ddr":{"hasExternalUrl":"http://demo.ckan.org","hasUsername":"nelsonpereira1991","hasOrganization":"infolab-devs","hasAPIKey":"b193a37e-de06-4b08-90db-a3cdc7ffad0f","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/ckan","dcterms":{"title":"CKAN"},"foaf":{"nick":"ckan","homepage":"http://ckan.org"},"$$hashKey":"object:143"}}}
 */


const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
/*const newExportRepoData = {
    dcterms: {title: "ckan2"},
    ddr: {
        hasExternalUrl: "http://192.168.33.60:5000",
        hasUsername: "nelsonpereira1991",
        hasOrganization: "organization-test1",
        hasAPIKey: "6a50a8d3-44ce-4825-b3c7-9bca1c57165f",
        hasPlatform: {
            //uri: "http://127.0.0.1:3001/repository_platform/ckan",
            uri: "http://" + Config.host + "/repository_platform/ckan",
            dcterms: {title: "CKAN"},
            foaf: {nick: "ckan", homepage: "http://192.168.33.60:5000"},
            $$hashKey: "object:143"
        }
    }
};*/

/*const newExportRepoData = {
    dcterms:{
        title:"ckan2"
    },
    ddr:{
        hasExternalUrl:"http://192.168.33.60:5000",
        hasUsername:"nelsonpereira1991",
        hasOrganization:"organization-test1",
        hasAPIKey:"6a50a8d3-44ce-4825-b3c7-9bca1c57165f",
        hasPlatform:{
            uri:"/r/repo_platform/14a5d3e5-2654-4918-ba7e-d7230cf2a293",
            foaf:{
                homepage:"http://ckan.org",
                nick:"ckan"
            },
            dcterms:{
                title:"CKAN"
            },
            ddr:{
                handle:"ckan",
                created:"2017-10-02T12:17:04.105Z",
                modified:"2017-10-02T12:17:04.106Z",
                humanReadableURI:"http://" + Config.host +"/repository_platform/ckan"
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
            $$hashKey:"object:142"
        }
    }
};*/


const newExportRepoData = {
    "dcterms":{
        "title":"ckan2"
    },
    "ddr":{
        "hasExternalUrl":"http://192.168.33.60:5000",
        "hasUsername":"nelsonpereira1991",
        "hasOrganization":"organization-test1",
        "hasAPIKey":"6a50a8d3-44ce-4825-b3c7-9bca1c57165f",
        "hasPlatform":{
            "uri":"/r/repo_platform/a765702d-2962-42c3-9e5c-df79deae9730",
            "foaf":{
                "homepage":"http://ckan.org",
                "nick":"ckan"
            },
            "dcterms":{
                "title":"CKAN"
            },
            "ddr":{
                "handle":"ckan",
                "created":"2017-10-10T15:19:09.041Z",
                "modified":"2017-10-10T15:19:09.044Z",
                "humanReadableURI":"http://127.0.0.1:3001/repository_platform/ckan"
            },
            "rdf":{
                "type":[
                    "http://dendro.fe.up.pt/ontology/0.1/RepositoryPlatform",
                    "http://dendro.fe.up.pt/ontology/0.1/Resource"
                ]
            },
            "types":{

            },
            "schema":{

            },
            "nie":{

            },
            "nfo":{

            },
            "research":{

            },
            "dcb":{

            },
            "achem":{

            },
            "bdv":{

            },
            "tsim":{

            },
            "biocn":{

            },
            "grav":{

            },
            "hdg":{

            },
            "cep":{

            },
            "social":{

            },
            "cfd":{

            },
            "tvu":{

            },
            "po":{

            },
            "$$hashKey":"object:42"
        }
    }
};

module.exports = newExportRepoData;
