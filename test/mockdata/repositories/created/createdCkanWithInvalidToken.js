const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const newExportRepoData =
  {
      // uri: "http://127.0.0.1:3001/external_repository/demouser1/ckan-config-invalid-token",
      uri: 'http://' + Config.host + '/external_repository/demouser1/ckan-config-invalid-token',
      dcterms: {
          modified: '2017-03-15T13:33:36.551Z',
          title: 'ckan config invalid token',
          // creator: "http://127.0.0.1:3001/user/demouser1"
          creator: 'http://' + Config.host + '/user/demouser1'
      },
      rdf: {
          type: 'http://dendro.fe.up.pt/ontology/0.1/ExternalRepository'
      },
      ddr: {
          hasPlatform: {
              // uri: "http://127.0.0.1:3001/repository_platform/ckan",
              uri: 'http://' + Config.host + '/repository_platform/ckan',
              dcterms: {
                  title: 'ckan config invalid token',
                  description: 'ckan config invalid token'
              },
              foaf: {
                  nick: 'ckan',
                  homepage: 'http://dendro-dev.fe.up.pt:5000'
              }
          },
          hasExternalUri: 'http://dendro-dev.fe.up.pt:5000',
          hasAPIKey: '6a50a8d3-44ce-4825-b3c7-9bca1c-cenas'
      },
      foaf: {},
      nie: {},
      nfo: {},
      research: {},
      dcb: {},
      achem: {},
      bdv: {},
      biocn: {},
      grav: {},
      hdg: {},
      tsim: {},
      cep: {},
      social: {},
      cfd: {}
  };

module.exports = newExportRepoData;
