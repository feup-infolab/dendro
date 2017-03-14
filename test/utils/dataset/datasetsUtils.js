var chai = require('chai');
var chaiHttp = require('chai-http');
chai.use(chaiHttp);

var exportFolderToRepository = function (jsonOnly, projectHandle, folderPath, agent, exportData, cb)
{
    //http://127.0.0.1:3001/project/publicproject/data/folder1?export_to_repository
    //http://127.0.0.1:3001/project/publicprojectcreatedbydemouser1/data/pastinhaLinda
    var path = "/project/" + projectHandle + "/data/" + folderPath + "?export_to_repository";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .send(exportData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(exportData)
            .end(function (err, res) {
                cb(err, res);
            });
    }

};

var createExportConfig = function (jsonOnly, agent, externalRepositoryData, cb) {
    var path = "/external_repositories/new";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .send(externalRepositoryData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(externalRepositoryData)
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getMyExternalRepositories = function (jsonOnly, agent, cb) {
    //http://127.0.0.1:3001/external_repositories/my
    var path = '/external_repositories/my';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports = {
    exportFolderToRepository: exportFolderToRepository,
    createExportConfig: createExportConfig,
    getMyExternalRepositories : getMyExternalRepositories
};
