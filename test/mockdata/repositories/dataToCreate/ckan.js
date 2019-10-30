/*
 {"dcterms":{"title":"ckan export config 1"},"ddr":{"hasExternalUrl":"http://demo.ckan.org","username":"nelsonpereira1991","hasOrganization":"infolab-devs","hasAPIKey":"b193a37e-de06-4b08-90db-a3cdc7ffad0f","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/ckan","dcterms":{"title":"CKAN"},"foaf":{"nick":"ckan","homepage":"http://ckan.org"},"$$hashKey":"object:143"}}}
 */

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
/* const newExportRepoData = {
    dcterms: {title: "ckan2"},
    ddr: {
        hasExternalUrl: "http://192.168.33.60:5000",
        username: "nelsonpereira1991",
        hasOrganization: "organization-test1",
        hasAPIKey: "6a50a8d3-44ce-4825-b3c7-9bca1c57165f",
        hasPlatform: {
            //uri: "http://127.0.0.1:3001/repository_platform/ckan",
            uri: "http://" + Config.hostAndPort + "/repository_platform/ckan",
            dcterms: {title: "CKAN"},
            foaf: {nick: "ckan", homepage: "http://192.168.33.60:5000"},
            $$hashKey: "object:143"
        }
    }
}; */

/* const newExportRepoData = {
    dcterms:{
        title:"ckan2"
    },
    ddr:{
        hasExternalUrl:"http://192.168.33.60:5000",
        username:"nelsonpereira1991",
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
                humanReadableURI:"http://" + Config.hostAndPort +"/repository_platform/ckan"
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
}; */

const newExportRepoData = {
    dcterms: {
        title: "ckan2"
    },
    ddr: {
        hasExternalUrl: "http://dendro-prd.fe.up.pt",
        username: "nelsonpereira1991",
        hasOrganization: "organization-test1",
        hasAPIKey: "15f8dac8-6f95-4318-ae5d-9b390088484c",
        hasPlatform: {
            uri: "/r/repo_platform/a765702d-2962-42c3-9e5c-df79deae9730",
            foaf: {
                homepage: "http://ckan.org",
                nick: "ckan"
            },
            dcterms: {
                title: "CKAN"
            },
            ddr: {
                handle: "ckan",
                created: "2017-10-10T15:19:09.041Z",
                modified: "2017-10-10T15:19:09.044Z",
                humanReadableURI: "/repository_platform/ckan"
            },
            rdf: {
                type: [
                    "http://dendro.fe.up.pt/ontology/0.1/RepositoryPlatform",
                    "http://dendro.fe.up.pt/ontology/0.1/Resource"
                ]
            },
            types: {

            },
            schema: {

            },
            nie: {

            },
            nfo: {

            },
            research: {

            },
            dcb: {

            },
            achem: {

            },
            bdv: {

            },
            tsim: {

            },
            biocn: {

            },
            grav: {

            },
            hdg: {

            },
            cep: {

            },
            social: {

            },
            cfd: {

            },
            tvu: {

            },
            po: {

            },
            $$hashKey: "object:42"
        }
    }
};

module.exports = newExportRepoData;
