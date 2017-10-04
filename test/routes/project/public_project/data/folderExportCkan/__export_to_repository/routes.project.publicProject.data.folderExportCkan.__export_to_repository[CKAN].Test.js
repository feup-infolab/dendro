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

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
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
let dataToCreateCkan = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/dataToCreate/ckan.js"));


let folderExportCkanData, folderExportedCkanDendroDiffsData, folderExportedCkanCkanDiffsData;
let ckanData;

describe("Export public project folderExportCkan level to ckan tests", function () {
    before(function (done) {
        appUtils.registerStartTimeForTestRoute(path.basename(__filename));
        this.timeout(Config.testsTimeout);
        addChangesToExportedCkanPackagesUnit.setup(publicProject, function (err, results) {
            should.equal(err, null);
            repositoryUtils.getMyExternalRepositories(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(6);
                ckanData = _.find(res.body, function (externalRepo) {
                    return externalRepo.dcterms.title === "ckan_local";
                });
                should.exist(ckanData);
                projectUtils.getProjectRootContent(true, agent, publicProject.handle, function (err, res) {
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
                    //TODO CHECK THAT THE UPLOADED FILE TO DENDRO IS NOT YET IS CKAN
                    done();
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
                    //TODO CHECK THAT THE UPLOADED FILE TO DENDRO IS NOW IN CKAN
                    done();
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        //TODO DELETE HERE A FILE IN DENDRO THEN TEST with the permissions and after that check if the file was deleted or not
        it("Should give a precondition failed error when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file deleted in Dendro and the user did not allow propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                folderUtils.getFolderContentsByUri(true, agent, folderExportedCkanDendroDiffsData.uri, function (err, res) {
                    //TODO GET HERE THE FILE THAT WAS UPLOADED IN DENDRO
                    //TODO THEN DELETE IT
                    //TODO THEN CHECK PERMISSIONS
                    res.statusCode.should.equal(200);
                    uploadedAndDeletedFileInDendroDataInDB = _.find(res.body, function (resourceData) {
                        return resourceData.nie.title === uploadedAndDeletedFileInDendroMockFile.name;
                    });
                    should.exist(uploadedAndDeletedFileInDendroDataInDB);
                    //pngMockFile
                    /*itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                        res.statusCode.should.equal(200);
                        itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                            res.statusCode.should.equal(200);
                            repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                res.statusCode.should.equal(412);
                                res.body.message.should.contain("Missing the permission: dendroDiffs");
                                //TODO CHECK THAT THE FILE IS STILL IN CKAN BECAUSE THE USER GAVE NO PERMISSIONS
                                done();
                            }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                        }, true);
                    }, false);*/

                    itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                        res.statusCode.should.equal(200);
                        repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                            res.statusCode.should.equal(412);
                            res.body.message.should.contain("Missing the permission: dendroDiffs");
                            //TODO CHECK THAT THE FILE IS STILL IN CKAN BECAUSE THE USER GAVE NO PERMISSIONS
                            done();
                        }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                    }, false);
                });
            });
        });

        //THERE ARE DENDRO DIFFS -> propagateDendroChangesIntoCkan === true -> export does happen
        /*it("Should give a success message when folderExportedCkanDendroDiffs was already exported previously but between the first and second export there was a file deleted in Dendro and the user allowed propagateDendroChangesIntoCkan", function (done) {
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });*/


        //When there are ckan diffs without permissions
        it("Should give a message that folderExportedCkanDendroDiffs was already exported", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanCkanDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                    res.statusCode.should.equal(412);
                    res.body.message.should.contain("Missing the permission: ckanDiffs");
                    done();
                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
            });
        });

        //When there are ckan diffs with permissions
        it("Should give a success message and export to ckan and delete the files in ckan that were also deleted in Dendro", function (done) {
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
