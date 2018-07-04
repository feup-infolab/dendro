process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const zipMockFile = rlequire("dendro", "test/mockdata/files/zipMockFile.js");
const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");

const CreateFoldersUnit = rlequire("dendro", "test/units/folders/createFolders.Unit.js");
const createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");

const projectsData = createProjectsUnit.projectsData;
const foldersData = CreateFoldersUnit.foldersData;
const filesData = [txtMockFile, zipMockFile];

class CreateFiles extends CreateFoldersUnit
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

CreateFiles.allFiles = filesData;

module.exports = CreateFiles;
