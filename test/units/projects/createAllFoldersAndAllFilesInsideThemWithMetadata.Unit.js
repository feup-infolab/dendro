process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

// const filesData = [csvMockFile, docMockFile, docxMockFile, pdfMockFile, pngMockFile, xlsMockFile, xlsxMockFile, zipMockFile, txtMockFile, odsMockFile];
const allFiles = createFilesUnit.allFiles;

let createProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;

let AddMetadataToFoldersUnit = require(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
let CreateFoldersUnit = require(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const foldersData = CreateFoldersUnit.foldersData;

class CreateAllFoldersAndAllFilesInsideThemWithMetadata extends AddMetadataToFoldersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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
                        async.mapSeries(allFiles, function (fileData, cb)
                        {
                            fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, fileData, function (err, res)
                            {
                                if (isNull(err))
                                {
                                    const newFileUri = JSON.parse(res.text)[0].uri;
                                    itemUtils.updateItemMetadataByUri(true, agent, newFileUri, fileData.metadata, function (err, res)
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
                    unitUtils.endLoad(self, callback);
                });
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }

    static shutdown (callback)
    {
        super.shutdown(callback);
    }
}

module.exports = CreateAllFoldersAndAllFilesInsideThemWithMetadata;
