process.env.NODE_ENV = "test";

const path = require("path");

const Pathfinder = global.Pathfinder;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));

let AddMetadataToFoldersSingleProjectUnit = require(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFoldersPublicProject.Unit.js"));

class UploadFileToProjectFolders extends AddMetadataToFoldersSingleProjectUnit
{
    static load (callback)
    {
        const self = this;
        self.markLoadStart(__filename);
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
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
                                self.markLoadEnd(path.basename(__filename));

                                callback(err, results);
                            });
                        });
                    }
                });
                /* }, function (err, results) {
                    callback(err, results);
                }); */
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = UploadFileToProjectFolders;
