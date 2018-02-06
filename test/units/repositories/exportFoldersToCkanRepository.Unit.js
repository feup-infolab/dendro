process.env.NODE_ENV = "test";

const _ = require("underscore");
const chai = require("chai");
const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));
let foldersToExport = [];

let ckanData;

// TODO chamar a createExportToRepositoriesConfigs.Unit.js
module.exports.setup = function (project, finish)
{
    let createExportToRepositoriesConfig = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/createExportToRepositoriesConfigs.Unit.js"));
    createExportToRepositoriesConfig.setup(project, function (err, results)
    {
        if (err)
        {
            finish(err, results);
        }
        else
        {
            console.log("---------- RUNNING UNIT exportFoldersToCkanRepository for: " + project.handle + " ----------");
            unitUtils.start(__filename);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
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
                                            Logger.log("info", "exportFolderByUriToRepository res is: " + JSON.stringify(res));
                                            cb(err, res);
                                        });
                                    }, function (err, results)
                                    {
                                        /* cb(err, results); */
                                        unitUtils.stop(__filename);
                                        finish(err, results);
                                    });
                                });
                            }
                        });
                        /* }, function (err, results) {
                            finish(err, results);
                        }); */
                    });
                }
            });
        }
    });
};
