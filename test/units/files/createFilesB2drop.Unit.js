process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const zipMockFile = rlequire("dendro", "test/mockdata/files/zipMockFile.js");
const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");

const CreateFoldersB2DropUnit = rlequire("dendro", "test/units/folders/createFoldersB2drop.Unit.js");

const foldersData = CreateFoldersB2DropUnit.foldersData;
const b2dropProjectData = rlequire("dendro", "test/mockdata/projects/b2drop_project.js");
const projectsData = [b2dropProjectData];
const filesData = [txtMockFile, zipMockFile];

module.exports.allFiles = filesData;

class CreateFilesB2drop extends CreateFoldersB2DropUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(CreateFilesB2drop);
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
                        async.mapSeries(filesData, function (file, cb)
                        {
                            fileUtils.uploadFile(true, agent, projectData.handle, folderData.name, file, function (err, res)
                            {
                                cb(err, res);
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
                    unitUtils.endLoad(CreateFilesB2drop, callback);
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

module.exports = CreateFilesB2drop;
