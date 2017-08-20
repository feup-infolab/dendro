/**
 * {"ddr":{"hasExternalUrl":"http://demoprints.eprints.org","hasUsername":"nelsonpereira1991","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/eprints","dcterms":{"title":"EPrints"},"foaf":{"nick":"eprints","homepage":"http://www.eprints.org/"},"$$hashKey":"object:145"}},"dcterms":{"title":"eprints export config 1"}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
const newExportRepoData = {
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
};

module.exports = newExportRepoData;
