process.env.NODE_ENV = "test";

const _ = require("underscore");
const path = require("path");
const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));
let foldersToExport = [];

let ckanData;

let createExportToRepositoriesConfig = require(Pathfinder.absPathInTestsFolder("units/repositories/createExportToRepositoriesConfigs.Unit.js"));
class ExportFoldersToCkanRepository extends createExportToRepositoriesConfig
{
    static load (callback)
    {
        const self = this;
        self.startLoad(__filename);
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                console.log("---------- RUNNING UNIT exportFoldersToCkanRepository for: " + project.handle + " ----------");

                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (err)
                    {
                        callback(err, agent);
                    }
                    else
                    {
                        repositoryUtils.getMyExternalRepositories(true, agent, function (err, res)
                        {
                            ckanData = _.find(res.body, function (externalRepo)
                            {
                                return externalRepo.dcterms.title === "ckan2";
                            });

                            // fazer export de apenas algumas pastas, e de seguida adicionar alterações ckandiffs e dendro diffs a algumas delas(de acordo com os nomes)
                            /* async.mapSeries(projects, function (project, cb) { */
                            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                            {
                                if (err)
                                {
                                    cb(err, agent);
                                }
                                else
                                {
                                    // export folders folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs folderExportedCkanCkanDiffs
                                    projectUtils.getProjectRootContent(true, agent, project.handle, function (err, res)
                                    {
                                        let folderExportedCkanNoDiffsData = _.find(res.body, function (folderData)
                                        {
                                            return folderData.nie.title === folderExportedCkanNoDiffs.name;
                                        });
                                        let folderExportedCkanDendroDiffsData = _.find(res.body, function (folderData)
                                        {
                                            return folderData.nie.title === folderExportedCkanDendroDiffs.name;
                                        });
                                        let folderExportedCkanCkanDiffsData = _.find(res.body, function (folderData)
                                        {
                                            return folderData.nie.title === folderExportedCkanCkanDiffs.name;
                                        });

                                        foldersToExport.push(folderExportedCkanNoDiffsData);
                                        foldersToExport.push(folderExportedCkanDendroDiffsData);
                                        foldersToExport.push(folderExportedCkanCkanDiffsData);

                                        async.mapSeries(foldersToExport, function (folder, cb)
                                        {
                                            repositoryUtils.exportFolderByUriToRepository(true, folder.uri, agent, {repository: ckanData}, function (err, res)
                                            {
                                                Logger.log("exportFolderByUriToRepository res is: " + JSON.stringify(res));
                                                cb(err, res);
                                            });
                                        }, function (err, results)
                                        {
                                            self.endLoad(__filename, callback);
                                        });
                                    });
                                }
                            });
                            /* }, function (err, results) {
                                callback(err, results);
                            }); */
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

module.exports = ExportFoldersToCkanRepository;
