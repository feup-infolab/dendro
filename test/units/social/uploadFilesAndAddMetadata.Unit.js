process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
const filesData = [txtMockFile];

let createProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;
const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const foldersData = [testFolder1];

let AddMetadataToFoldersUnit = require(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));

class UploadFilesAndAddMetadata extends AddMetadataToFoldersUnit
{
    static load (callback)
    {
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (err)
                    {
                        callback(err, agent);
                    }
                    else
                    {
                        async.mapSeries(projectsData, function (projectData, cb)
                        {
                            async.mapSeries(foldersData, function (folderData, cb)
                            {
                                async.mapSeries(filesData, function (fileData, cb)
                                {
                                    fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, fileData, function (err, res)
                                    {
                                        if (isNull(err))
                                        {
                                            itemUtils.updateItemMetadata(true, agent, projectData.handle, folderData.name, fileData.metadata, function (err, res)
                                            {
                                                cb(err, res);
                                            });
                                        }
                                        else
                                        {
                                            cb(err, res);
                                        }
                                    });
                                }, function (err, results)
                                {
                                    cb(err, results);
                                });
                            }, function (err, results)
                            {
                                cb(err, results);
                            });
                        }, function (err, results)
                        {
                            callback(err, results);
                        });
                    }
                });
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = UploadFilesAndAddMetadata;
