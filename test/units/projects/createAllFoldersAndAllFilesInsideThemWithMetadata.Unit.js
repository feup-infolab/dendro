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
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const csvMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/csvMockFile.js"));
const docMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docMockFile.js"));
const docxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/docxMockFile.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));
const pngMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));
const xlsMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsMockFile.js"));
const xlsxMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/xlsxMockFile.js"));
const zipMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/zipMockFile.js"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
const odsMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/odsMockFile.js"));

const filesData = [csvMockFile, docMockFile, docxMockFile, pdfMockFile, pngMockFile, xlsMockFile, xlsxMockFile, zipMockFile, txtMockFile, odsMockFile];

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
