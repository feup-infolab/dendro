process.env.NODE_ENV = "test";

const _ = require("underscore");

const rlequire = require("rlequire");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const repositoryUtils = rlequire("dendro", "test/utils/repository/repositoryUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const ckanTestUtils = rlequire("dendro", "test/utils/repository/ckanTestUtils.js");
const CkanUtils = rlequire("dendro", "src/utils/datasets/ckanUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");

const folderExportedCkanDendroDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanDendroDiffs.js");
const folderExportedCkanCkanDiffs = rlequire("dendro", "test/mockdata/folders/folderExportedCkanCkanDiffs.js");

const uploadedDeletedFileDendroMockFile = rlequire("dendro", "test/mockdata/files/uploadedAndDeletedFileInDendro.js");
const uploadedFileToCkan = rlequire("dendro", "test/mockdata/files/uploadedFileToCkan.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const metadataOnlyProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");

let ckanData;

const ExportFoldersToCkanRepositoryUnit = rlequire("dendro", "test/units/repositories/exportFoldersToCkanRepository.Unit.js");
class AddChangesToExportedCKANPackages extends ExportFoldersToCkanRepositoryUnit
{
    static load (callback)
    {
        async.map([publicProject, privateProject, metadataOnlyProject], function (project, callback)
        {
            console.log("---------- RUNNING UNIT addChangesToExportedCkanPackages for: " + project.handle + " ----------");

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
                                                unitUtils.endLoad(AddChangesToExportedCKANPackages, callback);
                                            });
                                        });
                                    });
                                });
                            }
                        });
                    });
                }
            });
        }, function (err, result)
        {
            callback(err, result);
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

module.exports = AddChangesToExportedCKANPackages;
