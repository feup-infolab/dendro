process.env.NODE_ENV = "test";

const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));
const CkanUtils = require(Pathfinder.absPathInSrcFolder("/utils/datasets/ckanUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));

const uploadedDeletedFileDendroMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedAndDeletedFileInDendro.js"));
const uploadedFileToCkan = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedFileToCkan.js"));

let ckanData;

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;
class AddChangesToExportedCKANPackages extends TestUnit
{
    static init (callback)
    {
        const exportFoldersToCkanRepositoryUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/exportFoldersToCkanRepository.Unit.js"));

        exportFoldersToCkanRepositoryUnit.init(project, function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                console.log("---------- RUNNING UNIT addChangesToExportedCkanPackages for: " + project.handle + " ----------");
                unitUtils.start(__filename);
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
                                        let folderExportedCkanDendroDiffsData = _.find(res.body, function (folderData)
                                        {
                                            return folderData.nie.title === folderExportedCkanDendroDiffs.name;
                                        });
                                        let folderExportedCkanCkanDiffsData = _.find(res.body, function (folderData)
                                        {
                                            return folderData.nie.title === folderExportedCkanCkanDiffs.name;
                                        });

                                        // UPLOAD A FILE TO DENDRO SO THAT THERE EXISTS DENDROCHANGES
                                        fileUtils.uploadFile(true, agent, project.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedDeletedFileDendroMockFile, function (err, res)
                                        {
                                            let packageId = CkanUtils.createPackageID(folderExportedCkanCkanDiffsData.uri);
                                            let packageInfo = {
                                                id: packageId
                                            };
                                            // UPLOAD A FILE TO CKAN SO THAT THERE EXISTS CKANCHANGES
                                            ckanTestUtils.uploadFileToCkanPackage(true, agent, {repository: ckanData}, uploadedFileToCkan, packageInfo, function (err, res)
                                            {
                                                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res)
                                                {
                                                    /* cb(err, res); */
                                                    unitUtils.end(__filename);
                                                    callback(err, res);
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
    }
}

module.exports = AddChangesToExportedCKANPackages;
