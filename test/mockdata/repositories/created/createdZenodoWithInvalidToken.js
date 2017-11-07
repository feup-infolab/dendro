const newExportRepoData =
  {
      uri: 'http://127.0.0.1:3001/external_repository/demouser1/zenodo-export-config-invalid-token',
      dcterms: {
          modified: '2017-03-15T15:11:53.825Z',
          title: 'zenodo export config invalid token',
          creator: 'http://127.0.0.1:3001/user/demouser1'
      },
      rdf: {
          type: 'http://dendro.fe.up.pt/ontology/0.1/ExternalRepository'
      },
      ddr: {
          hasPlatform: {
              uri: 'http://127.0.0.1:3001/repository_platform/zenodo',
              dcterms: {
                  title: 'Zenodo'
              },
              foaf: {
                  nick: 'zenodo',
                  homepage: 'http://www.zenodo.org/'
              }
          },
          hasExternalUri: 'http://www.zenodo.org/',
          hasAccessToken: '1234567Cenasdfksdfd'
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
