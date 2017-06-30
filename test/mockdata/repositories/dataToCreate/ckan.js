/*
 {"dcterms":{"title":"ckan export config 1"},"ddr":{"hasExternalUrl":"http://demo.ckan.org","hasUsername":"nelsonpereira1991","hasOrganization":"infolab-devs","hasAPIKey":"b193a37e-de06-4b08-90db-a3cdc7ffad0f","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/ckan","dcterms":{"title":"CKAN"},"foaf":{"nick":"ckan","homepage":"http://ckan.org"},"$$hashKey":"object:143"}}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
const newExportRepoData = {
    dcterms: {title: "ckan export config 1"},
    ddr: {
        hasExternalUrl: "http://demo.ckan.org",
        hasUsername: "nelsonpereira1991",
        hasOrganization: "infolab-devs",
        hasAPIKey: "b193a37e-de06-4b08-90db-a3cdc7ffad0f",
        hasPlatform: {
            uri: "http://127.0.0.1:3001/repository_platform/ckan",
            dcterms: {title: "CKAN"},
            foaf: {nick: "ckan", homepage: "http://ckan.org"},
            $$hashKey: "object:143"
        }
    }
};

module.exports = newExportRepoData;
