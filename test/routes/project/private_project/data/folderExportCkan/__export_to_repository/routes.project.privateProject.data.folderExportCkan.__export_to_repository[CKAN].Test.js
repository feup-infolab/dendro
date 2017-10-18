process.env.NODE_ENV = 'test';

const chai = require("chai");
const chaiHttp = require("chai-http");
const path = require('path');
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const ckanUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const folderExportCkan = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportCkan.js"));
const folderExportedCkanDendroDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanDendroDiffs.js"));
const folderExportedCkanCkanDiffs = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderExportedCkanCkanDiffs.js"));

//The file that is uploaded&deleted in dendro
/*const pngMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/pngMockFile.js"));*/
const uploadedAndDeletedFileInDendroMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedAndDeletedFileInDendro.js"));
//The file that is uploaded directly into the ckan repository
const uploadedFileToCkan = require(Pathfinder.absPathInTestsFolder("mockdata/files/uploadedFileToCkan.js"));

let uploadedAndDeletedFileInDendroDataInDB, uploadedFileToCkanDataInDb;

const addChangesToExportedCkanPackagesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/addChangesToExportedCkanPackages.Unit.js"));

const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let createdUnknownRepo = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/created/created_unknown_export_repo.js"));


let folderExportCkanData, folderExportedCkanDendroDiffsData, folderExportedCkanCkanDiffsData;
let ckanData;

describe("Export private project folderExportCkan level to ckan tests", function () {
    before(function (done) {
        appUtils.newTestRoutetLog(path.basename(__filename));
        this.timeout(Config.testsTimeout);
        addChangesToExportedCkanPackagesUnit.setup(privateProject, function (err, results) {
            should.equal(err, null);
            repositoryUtils.getMyExternalRepositories(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(6);
                ckanData = _.find(res.body, function (externalRepo) {
                    return externalRepo.dcterms.title === "ckan2";
                });
                should.exist(ckanData);
                projectUtils.getProjectRootContent(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    folderExportCkanData = _.find(res.body, function (folderData) {
                        return folderData.nie.title === folderExportCkan.name;
                    });
                    folderExportedCkanDendroDiffsData = _.find(res.body, function (folderData) {
                        return folderData.nie.title === folderExportedCkanDendroDiffs.name;
                    });
                    folderExportedCkanCkanDiffsData = _.find(res.body, function (folderData) {
                        return folderData.nie.title === folderExportedCkanCkanDiffs.name;
                    });
                    should.exist(folderExportCkanData);
                    should.exist(folderExportedCkanDendroDiffsData);
                    should.exist(folderExportedCkanCkanDiffsData);
                    done();
                });
            });
        });
    });

    describe("[POST] [CKAN] /project/:handle/data/:foldername?export_to_repository", function () {
        it("Should give an error when the target repository is invalid[not ckan b2share zenodo etc]", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //jsonOnly, projectHandle, folderPath, agent, exportData, cb
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri, agent, createdUnknownRepo, function (err, res) {
                    console.log(res);
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("Invalid target repository");
                    done();
                });
            });
        });

        it("Should give an error when the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Permission denied : cannot export resource because you do not have permissions to edit resources inside this project.");
                done();
            });
        });

        it("Should give an error message when the user is logged in as demouser3(not a creator or collaborator of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : cannot export resource because you do not have permissions to edit resources inside this project.");
                    done();
                });
            });
        });

        it("Should give a success message when the user is logged in as demouser2(a collaborator of the project)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        //THE CASE WHEN THE FOLDER URI DOES NOT EXIST
        it("Should give a not found error when the folder uri does not exist when the user is logged in as demouser1(the creator of all projects)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri + "-bugHere", agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should a give a not found error when the folder uri does not exist when the user is logged in as demouser2(a collaborator on all projects)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri + "-bugHere", agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give a not found error when the folder uri does not exist when the user is logged in as demouser3(is not a collaborator or creator on any project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportCkanData.uri + "-bugHere", agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        //THERE ARE DENDRO DIFFS -> propagateDendroChangesIntoCkan === false -> export does not happen
        it("Should give a precondition failed error when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file added in Dendro and the user did not allow propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(412);
                    res.body.message.should.contain("Missing the permission: dendroDiffs");
                    ckanUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
                        should.not.exist(err);
                        uploadedAndDeletedFileInDendroDataInDB = _.find(res, function (resourceInCkan) {
                            return resourceInCkan.name === uploadedAndDeletedFileInDendroMockFile.name;
                        });
                        should.not.exist(uploadedAndDeletedFileInDendroDataInDB);
                        done();
                    });
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        //THERE ARE DENDRO DIFFS -> propagateDendroChangesIntoCkan === true -> export does happen
        it("Should give a success message when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file added in Dendro and the user allowed propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    ckanUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
                        should.not.exist(err);
                        uploadedAndDeletedFileInDendroDataInDB = _.find(res, function (resourceInCkan) {
                            return resourceInCkan.name === uploadedAndDeletedFileInDendroMockFile.name;
                        });
                        should.exist(uploadedAndDeletedFileInDendroDataInDB);
                        done();
                    });
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        it("Should give a precondition failed error when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file deleted in Dendro and the user did not allow propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                folderUtils.getFolderContentsByUri(true, agent, folderExportedCkanDendroDiffsData.uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    uploadedAndDeletedFileInDendroDataInDB = _.find(res.body, function (resourceData) {
                        return resourceData.nie.title === uploadedAndDeletedFileInDendroMockFile.name;
                    });
                    should.exist(uploadedAndDeletedFileInDendroDataInDB);
                    itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                        res.statusCode.should.equal(200);
                        repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                            res.statusCode.should.equal(412);
                            res.body.message.should.contain("Missing the permission: dendroDiffs");
                            //CHECKS THAT THE FILE IS STILL IN CKAN BECAUSE THE USER GAVE NO PERMISSIONS in propagateDendroChangesIntoCkan
                            ckanUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
                                should.not.exist(err);
                                uploadedAndDeletedFileInDendroDataInDB = null;
                                uploadedAndDeletedFileInDendroDataInDB = _.find(res, function (resourceInCkan) {
                                    return resourceInCkan.name === uploadedAndDeletedFileInDendroMockFile.name;
                                });
                                should.exist(uploadedAndDeletedFileInDendroDataInDB);
                                done();
                            });
                        }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                    }, false);
                });
            });
        });

        it("Should give a success message when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file deleted in Dendro and the user allowed propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    //CHECKS THAT THE FILE WAS DELETED IN CKAN BECAUSE OF THE USER PERMISSIONS in propagateDendroChangesIntoCkan
                    ckanUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
                        should.not.exist(err);
                        uploadedAndDeletedFileInDendroDataInDB = null;
                        uploadedAndDeletedFileInDendroDataInDB = _.find(res, function (resourceInCkan) {
                            return resourceInCkan.name === uploadedAndDeletedFileInDendroMockFile.name;
                        });
                        should.not.exist(uploadedAndDeletedFileInDendroDataInDB);
                        done();
                    });
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        //When there are ckan diffs without permissions
        it("Should give a message that folderExportedCkanCkanDiffs has ckanDiffs and the user gave no permission", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(412);
                    res.body.message.should.contain("Missing the permission: ckanDiffs");
                    //uploadedFileToCkan should still be in ckan
                    ckanUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanCkanDiffsData, function (err, res) {
                        should.not.exist(err);
                        uploadedFileToCkanDataInDb = null;
                        uploadedFileToCkanDataInDb = _.find(res, function (resourceInCkan) {
                            return resourceInCkan.name === uploadedFileToCkan.name;
                        });
                        should.exist(uploadedFileToCkanDataInDb);
                        done();
                    });
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        //When there are ckan diffs with permissions
        it("Should give a success message and export to ckan when there were ckanDiffs for folderExportedCkanCkanDiffs but the user gave permission", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = true;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

    });

    after(function (done) {
        //destroy graphs
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});
