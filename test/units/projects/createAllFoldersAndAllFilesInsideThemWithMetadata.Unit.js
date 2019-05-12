process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

// const filesData = [csvMockFile, docMockFile, docxMockFile, pdfMockFile, pngMockFile, xlsMockFile, xlsxMockFile, zipMockFile, txtMockFile, odsMockFile];
const createFilesUnit = rlequire("dendro", "test/units/files/createFiles.Unit.js");

const allFiles = createFilesUnit.allFiles;

let createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = createProjectsUnit.projectsData;

let AddMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
let CreateFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const foldersData = CreateFoldersUnit.foldersData;

class CreateAllFoldersAndAllFilesInsideThemWithMetadata extends AddMetadataToFoldersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateAllFoldersAndAllFilesInsideThemWithMetadata);
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
                    unitUtils.endLoad(CreateAllFoldersAndAllFilesInsideThemWithMetadata, callback);
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
