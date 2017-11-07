/**
 * Created by Utilizador on 14/03/2017.
 */
/*
{
    "ddr":{"hasExternalUrl":"trng-b2share.eudat.eu","hasAccessToken":"MmGKBzjpdlT382lag38zxhsKttZDw9e7u6zZmzucVFUu1aYM5i55WpeUSgFE","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/b2share","dcterms":{"title":"EUDAT B2Share","description":"A EUDAT B2Share deposition"},
    "foaf":{"nick":"b2share","homepage":"https://b2share.eudat.eu/"},
    "$$hashKey":"object:146"}},
    "dcterms":{"title":"b2share config 2"}
} */

/*
    This data is used to create a new export repository configuration
    Use this JSON to create a new export config
 */
const newExportRepoData = {
    ddr: {
        hasExternalUrl: 'errorRepoConfig.com',
        hasAccessToken: 'blablablaAccessTokeb',
        hasPlatform: {
            uri: 'http://127.0.0.1:3001/repository_platform/unknownPlatform',
            dcterms: {title: 'Unknown Repository', description: 'An unknown deposition'},
            foaf: {nick: 'unknown', homepage: 'https://errorRepoConfig.com'},
            $$hashKey: 'object:146'
        }
    },
    dcterms: {title: 'b2share config 2'}
};

module.exports = newExportRepoData;
