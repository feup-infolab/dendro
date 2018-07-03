process.env.NODE_ENV = "test";

const _ = require("underscore");
const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const async = require("async");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const repositoryUtils = rlequire("dendro", "test/utils/repository/repositoryUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const folderExportedCkanNoDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanNoDiffs.js");
const folderExportedCkanDendroDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanDendroDiffs.js");
const folderExportedCkanCkanDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanCkanDiffs.js");
let foldersToExport = [];

let ckanData;

let createExportToRepositoriesConfig = rlequire("dendro", "test/units/repositories/createExportToRepositoriesConfigs.Unit.js");
class ExportFoldersToCkanRepository extends createExportToRepositoriesConfig
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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
                                        Logger.log("exportFolderByUriToRepository res is: " + JSON.stringify(res);
                                        cb(err, res);
                                    });
                                }, function (err, results)
                                {
                                    unitUtils.endLoad(self, callback);
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
