const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const exportToRepository = function (jsonOnly, projectHandle, agent, exportData, cb)
{
    // TODO /project/:handle?export_to_repository
    // TODO this is not implemented i think
    const path = "/project/" + projectHandle + "?export_to_repository";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const calculate_ckan_repository_diffs = function (jsonOnly, resourceUri, agent, exportData, cb)
{
    const path = resourceUri + "?calculate_ckan_repository_diffs";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const exportFolderToRepository = function (jsonOnly, projectHandle, folderPath, agent, exportData, cb, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan)
{
    // http://127.0.0.1:3001/project/publicproject/data/folder1?export_to_repository
    // http://127.0.0.1:3001/project/publicprojectcreatedbydemouser1/data/pastinhaLinda
    exportData.propagateDendroChangesIntoCkan = propagateDendroChangesIntoCkan;
    exportData.deleteChangesOriginatedFromCkan = deleteChangesOriginatedFromCkan;

    const path = "/project/" + projectHandle + "/data/" + folderPath + "?export_to_repository";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const exportFolderByUriToRepository = function (jsonOnly, folderUri, agent, exportData, cb, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan)
{
    // http://folderUri?export_to_repository
    exportData.propagateDendroChangesIntoCkan = propagateDendroChangesIntoCkan;
    exportData.deleteChangesOriginatedFromCkan = deleteChangesOriginatedFromCkan;

    const path = folderUri + "?export_to_repository";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(exportData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const createExportConfig = function (jsonOnly, agent, externalRepositoryData, cb)
{
    const path = "/external_repositories/new";
    if (jsonOnly)
    {
        agent
            .post(path)
            .set("Accept", "application/json")
            .send(externalRepositoryData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .send(externalRepositoryData)
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getMyExternalRepositories = function (jsonOnly, agent, cb)
{
    // http://127.0.0.1:3001/external_repositories/my
    const path = "/external_repositories/my";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

const getAllExternalRepositories = function (jsonOnly, agent, cb)
{
    // http://127.0.0.1:3001/external_repositories/
    const path = "/external_repositories";
    if (jsonOnly)
    {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set("Accept", "text/html")
            .set("Content-Type", "application/json")
            .end(function (err, res)
            {
                cb(err, res);
            });
    }
};

module.exports = {
    exportFolderToRepository: exportFolderToRepository,
    exportToRepository: exportToRepository,
    exportFolderByUriToRepository: exportFolderByUriToRepository,
    createExportConfig: createExportConfig,
    getMyExternalRepositories: getMyExternalRepositories,
    getAllExternalRepositories: getAllExternalRepositories,
    calculate_ckan_repository_diffs: calculate_ckan_repository_diffs
};
