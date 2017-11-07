/**
 * {"ddr":{"hasExternalUrl":"http://www.zenodo.org/","hasAccessToken":"dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/zenodo","dcterms":{"title":"Zenodo"},"foaf":{"nick":"zenodo","homepage":"http://www.zenodo.org/"},"$$hashKey":"object:149"}},"dcterms":{"title":"zenodo export config 1"}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
// TODO this is not correct
/* const newExportRepoData = {
    ddr: {
        hasExternalUrl: "http://www.zenodo.org/",
        hasAccessToken: "dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs",
        hasPlatform: {
            uri: "http://127.0.0.1:3001/repository_platform/zenodo",
            dcterms: {title: "Zenodo"},
            foaf: {nick: "zenodo", homepage: "http://www.zenodo.org/"},
            $$hashKey: "object:149"
        }
    },
    dcterms: {title: "zenodo export config 1"}
}; */

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const newExportRepoData = {
    dcterms: {
        title: 'Zenodo'
    },
    ddr: {
        hasExternalUrl: 'http://www.zenodo.org/',
        hasAccessToken: 'dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs',
        hasPlatform: {
            uri: '/r/repo_platform/14a5d3e5-2654-4918-ba7e-d7230cf2a295',
            foaf: {
                homepage: 'http://www.zenodo.org/',
                nick: 'zenodo'
            },
            dcterms: {
                title: 'ZENODO'
            },
            ddr: {
                handle: 'zenodo',
                created: '2017-10-02T12:17:04.105Z',
                modified: '2017-10-02T12:17:04.106Z',
                humanReadableURI: 'http://' + Config.host + '/repository_platform/zenodo'
            },
            rdf: {
                type: [
                    'http://dendro.fe.up.pt/ontology/0.1/RepositoryPlatform',
                    'http://dendro.fe.up.pt/ontology/0.1/Resource'
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
            $$hashKey: 'object:149'
        }
    }
};

module.exports = newExportRepoData;
