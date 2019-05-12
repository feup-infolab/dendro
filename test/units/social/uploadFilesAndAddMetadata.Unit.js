process.env.NODE_ENV = "test";

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test//utils/item/itemUtils");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");
const filesData = [txtMockFile];

let createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = createProjectsUnit.projectsData;
const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const foldersData = [testFolder1];

let AddMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");

class UploadFilesAndAddMetadata extends AddMetadataToFoldersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(UploadFilesAndAddMetadata);
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
                    unitUtils.endLoad(UploadFilesAndAddMetadata, callback);
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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}

(async () => {await require("@feup-infolab/docker-mocha").runSetup(UploadFilesAndAddMetadata);})();

module.exports = UploadFilesAndAddMetadata;
