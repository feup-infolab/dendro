/**
 * {"ddr":{"hasExternalUrl":"http://demoprints.eprints.org","hasUsername":"nelsonpereira1991","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/eprints","dcterms":{"title":"EPrints"},"foaf":{"nick":"eprints","homepage":"http://www.eprints.org/"},"$$hashKey":"object:145"}},"dcterms":{"title":"eprints export config 1"}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
/* const newExportRepoData = {
    ddr: {
        hasExternalUrl: "http://demoprints.eprints.org",
        hasUsername: "nelsonpereira1991",
        hasPlatform: {
            uri: "http://127.0.0.1:3001/repository_platform/eprints",
            dcterms: {title: "EPrints"},
            foaf: {nick: "eprints", "homepage": "http://www.eprints.org/"},
            $$hashKey: "object:145"
        }
    },
    dcterms: {title: "eprints export config 1"}
}; */

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const newExportRepoData = {
    dcterms: {
        title: "EPrints"
    },
    ddr: {
        hasExternalUrl: "http://demoprints.eprints.org",
        hasUsername: "nelsonpereira1991",
        hasPlatform: {
            uri: "/r/repo_platform/14a5d3e5-2654-4918-ba7e-d7230cf2a296",
            foaf: {
                homepage: "http://www.eprints.org/",
                nick: "eprints"
            },
            dcterms: {
                title: "EPRINTS"
            },
            ddr: {
                handle: "eprints",
                created: "2017-10-02T12:17:04.105Z",
                modified: "2017-10-02T12:17:04.106Z",
                humanReadableURI: "http://" + Config.host + "/repository_platform/eprints"
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
            $$hashKey: "object:145"
        }
    }
};

module.exports = newExportRepoData;
