process.env.NODE_ENV = "test";

const path = require("path");

const rlequire = require("rlequire");
const async = require("async");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");

let AddMetadataToFoldersSingleProjectUnit = rlequire("dendro", "test/units/metadata/addMetadataToFoldersPublicProject.Unit.js");

class UploadFileToProjectFolders extends AddMetadataToFoldersSingleProjectUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(UploadFileToProjectFolders);
        // procurar para todos os projetos as pastas da root e fazer upload de um ficheiro
        /* async.mapSeries(projects, function (project, cb) { */
        console.log("---------- RUNNING UNIT uploadFileToProjectFolders.Unit for: " + project.handle + " ----------");

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            if (err)
            {
                callback(err, agent);
            }
            else
            {
                projectUtils.getProjectRootContent(true, agent, project.handle, function (err, res)
                {
                    async.mapSeries(res.body, function (folder, callback)
                    {
                        fileUtils.uploadFile(true, agent, project.handle, folder.nie.title, txtMockFile, function (err, res)
                        {
                            fileUtils.downloadFileByUri(true, agent, res.body[0].uri, function (error, res)
                            {
                                callback(error, res);
                            });
                        });
                    }, function (err, results)
                    {
                        unitUtils.endLoad(UploadFileToProjectFolders, callback);
                    });
                });
            }
        });
        /* }, function (err, results) {
            callback(err, results);
        }); */
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

module.exports = UploadFileToProjectFolders;
