process.env.NODE_ENV = 'test';

const _ = require("underscore");
const chai = require("chai");
const slug = require('slug');
const should = chai.should();
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const async = require("async");
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const ckanUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const b2share = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/b2share"));
const ckan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan"));
const dspace = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/dspace"));
const eprints = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/eprints"));
const figshare = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/figshare"));
const zenodo = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/zenodo"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const projects = [publicProject, privateProject, metadataOnlyProject];

const folderExportedCkanNoDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanNoDiffs.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));

/*const pngMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));
const pdfMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pdfMockFile.js"));*/

const uploadedDeletedFileDendroMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedAndDeletedFileInDendro.js"));
const uploadedFileToCkan = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedFileToCkan.js"));

let foldersToExport = [];

const dataToCreateExportConfigs = [b2share, ckan, dspace, eprints, figshare, zenodo];
let ckanData;

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

module.exports.setup = function(finish)
{
    const exportFoldersToCkanRepositoryUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/exportFoldersToCkanRepository.Unit.js"));

    exportFoldersToCkanRepositoryUnit.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                if(err)
                {
                    finish(err, agent);
                }
                else
                {
                    repositoryUtils.getMyExternalRepositories(true, agent, function (err, res) {
                        res.statusCode.should.equal(200);
                        res.body.length.should.equal(6);
                        ckanData = _.find(res.body, function (externalRepo) {return externalRepo.dcterms.title === "ckan_local";});
                        should.exist(ckanData);

                        //fazer export de apenas algumas pastas, e de seguida adicionar alterações ckandiffs e dendro diffs a algumas delas(de acordo com os nomes)
                        async.mapSeries(projects, function (project, cb) {
                            userUtils.loginUser(demouser1.username,demouser1.password, function (err, agent) {
                                if(err)
                                {
                                    cb(err, agent);
                                }
                                else
                                {
                                    //export folders folderExportedCkanNoDiffs, folderExportedCkanDendroDiffs folderExportedCkanCkanDiffs
                                    projectUtils.getProjectRootContent(true, agent, project.handle, function (err, res) {
                                        res.statusCode.should.equal(200);
                                        let folderExportedCkanDendroDiffsData = _.find(res.body, function (folderData) {
                                            return folderData.nie.title === folderExportedCkanDendroDiffs.name;
                                        });
                                        let folderExportedCkanCkanDiffsData = _.find(res.body, function (folderData) {
                                            return folderData.nie.title === folderExportedCkanCkanDiffs.name;
                                        });
                                        should.exist(folderExportedCkanDendroDiffsData);
                                        should.exist(folderExportedCkanCkanDiffsData);

                                        //UPLOAD A FILE TO DENDRO SO THAT THERE EXISTS DENDROCHANGES
                                        fileUtils.uploadFile(true, agent, project.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedDeletedFileDendroMockFile, function (err, res) {
                                            res.statusCode.should.equal(200);
                                            let id = slug(folderExportedCkanCkanDiffsData.uri, "-");
                                            let packageId = id.replace(/[^A-Za-z0-9-]/g, "-").replace(/\./g, "-").toLowerCase();
                                            let packageInfo = {
                                                id: packageId
                                            };
                                            //UPLOAD A FILE TO CKAN SO THAT THERE EXISTS CKANCHANGES
                                            ckanUtils.uploadFileToCkanPackage(true, agent, {repository: ckanData}, uploadedFileToCkan, packageInfo, function (err, res) {
                                                repositoryUtils.calculate_ckan_repository_diffs(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                                    res.statusCode.should.equal(200);
                                                    cb(err, res);
                                                });
                                            });
                                        });
                                    });
                                }
                            });
                        }, function (err, results) {
                            finish(err, results);
                        });
                    });
                }
            });
        }
    });
};