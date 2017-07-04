/**
 * {"ddr":{"hasExternalUrl":"http://www.zenodo.org/","hasAccessToken":"dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/zenodo","dcterms":{"title":"Zenodo"},"foaf":{"nick":"zenodo","homepage":"http://www.zenodo.org/"},"$$hashKey":"object:149"}},"dcterms":{"title":"zenodo export config 1"}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
const newExportRepoData = {
    ddr:{
        hasExternalUrl:"http://www.zenodo.org/",
        hasAccessToken:"dgOQrI0zzx5tZ1zSTSaBCtmik3SbJmxaJKW1GZV9ZUe7b7EV9Rr4XSTWMcTs",
        hasPlatform:{
            uri:"http://127.0.0.1:3001/repository_platform/zenodo",
            dcterms:{title:"Zenodo"},
            foaf:{nick:"zenodo",homepage:"http://www.zenodo.org/"},
            $$hashKey:"object:149"
        }
    },
    dcterms:{title:"zenodo export config 1"}
};

module.exports = newExportRepoData;