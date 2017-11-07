/*
 {"ddr":{"hasExternalUrl":"http://www.figshare.com/","hasConsumerKey":"5b20a02208d83301ae8dd5d6ddb868b75f5de2b4","hasConsumerSecret":"98c1bb7bbb4cd465d44023a4baedc1e898bca485a5d5ea1803fbad8a2221621344e54aec481cbdcfb3f8902af161d58c859619bf020ba796c687e54cb4518d93","hasAccessToken":"7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125","hasAccessTokenSecret":"7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125","hasPlatform":{"uri":"http://127.0.0.1:3001/repository_platform/figshare","dcterms":{"title":"Figshare"},"foaf":{"nick":"figshare","homepage":"http://www.figshare.com/"},"$$hashKey":"object:146"}},"dcterms":{"title":"figshare export config"}}
 */

/*
 This data is used to create a new export repository configuration
 Use this JSON to create a new export config
 */
/* const newExportRepoData = {
    ddr: {
        hasExternalUrl: "http://www.figshare.com/",
        hasConsumerKey: "5b20a02208d83301ae8dd5d6ddb868b75f5de2b4",
        hasConsumerSecret: "98c1bb7bbb4cd465d44023a4baedc1e898bca485a5d5ea1803fbad8a2221621344e54aec481cbdcfb3f8902af161d58c859619bf020ba796c687e54cb4518d93",
        hasAccessToken: "7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125",
        hasAccessTokenSecret: "7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125",
        hasPlatform: {
            uri: "http://127.0.0.1:3001/repository_platform/figshare",
            dcterms: {title: "Figshare"},
            foaf: {nick: "figshare", homepage: "http://www.figshare.com/"},
            $$hashKey: "object:146"
        }
    },
    dcterms: {title: "figshare export config"}
}; */

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const newExportRepoData = {
    dcterms: {
        title: 'Figshare'
    },
    ddr: {
        hasExternalUrl: 'http://www.figshare.com/',
        hasConsumerKey: '5b20a02208d83301ae8dd5d6ddb868b75f5de2b4',
        hasConsumerSecret: '98c1bb7bbb4cd465d44023a4baedc1e898bca485a5d5ea1803fbad8a2221621344e54aec481cbdcfb3f8902af161d58c859619bf020ba796c687e54cb4518d93',
        hasAccessToken: '7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125',
        hasAccessTokenSecret: '7fb6cdcb1c89d3e11d42c28afec6028327da1abdb07260a3c9188279363937d1593d61dac1220f2433b7add0562cd63169fa0ce1c41a3ac9fe7b35de24f1b125',
        hasPlatform: {
            uri: '/r/repo_platform/14a5d3e5-2654-4918-ba7e-d7230cf2a297',
            foaf: {
                homepage: 'http://www.figshare.com/',
                nick: 'figshare'
            },
            dcterms: {
                title: 'FIGSHARE'
            },
            ddr: {
                handle: 'figshare',
                created: '2017-10-02T12:17:04.105Z',
                modified: '2017-10-02T12:17:04.106Z',
                humanReadableURI: 'http://' + Config.host + '/repository_platform/figshare'
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
            $$hashKey: 'object:146'
        }
    }
};

module.exports = newExportRepoData;
