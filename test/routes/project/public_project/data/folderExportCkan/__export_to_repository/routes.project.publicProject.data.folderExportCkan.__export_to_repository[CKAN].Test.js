process.env.NODE_ENV = 'test';

const chai = require("chai");
const chaiHttp = require("chai-http");
const path = require('path');
const should = chai.should();
const expect = chai.expect;
const md5File = require("md5-file");
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
const ckanTestUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/ckanTestUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));

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

const emptyFileMock = require(Pathfinder.absPathInTestsFolder("mockdata/files/emptyFileMock.js"));

let uploadedAndDeletedFileInDendroDataInDB, uploadedFileToCkanDataInDb, emptyFileDataInDb;

const addChangesToExportedCkanPackagesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/repositories/addChangesToExportedCkanPackages.Unit.js"));

const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let createdUnknownRepo = require(Pathfinder.absPathInTestsFolder("mockdata/repositories/created/created_unknown_export_repo.js"));


let folderExportCkanData, folderExportedCkanDendroDiffsData, folderExportedCkanCkanDiffsData;
let ckanData;

describe("Export public project folderExportCkan level to ckan tests", function () {
    before(function (done) {
        appUtils.newTestRouteLog(path.basename(__filename));
        this.timeout(Config.testsTimeout);
        addChangesToExportedCkanPackagesUnit.setup(publicProject, function (err, results) {
            should.equal(err, null);
            repositoryUtils.getMyExternalRepositories(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.length.should.equal(6);
                ckanData = _.find(res.body, function (externalRepo) {
                    return externalRepo.dcterms.title === "ckan2";
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
        this.timeout(Config.testsTimeout);
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
                    ckanTestUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
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
                    ckanTestUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
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
                    //IT is necessary to delete the file twice even if passing really_delete to really delete a file
                    itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                        res.statusCode.should.equal(200);
                        itemUtils.deleteItemByUri(true, agent, uploadedAndDeletedFileInDendroDataInDB.uri, function (err, res) {
                            res.statusCode.should.equal(200);
                            repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                res.statusCode.should.equal(412);
                                res.body.message.should.contain("Missing the permission: dendroDiffs");
                                //CHECKS THAT THE FILE IS STILL IN CKAN BECAUSE THE USER GAVE NO PERMISSIONS in propagateDendroChangesIntoCkan
                                ckanTestUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
                                    should.not.exist(err);
                                    uploadedAndDeletedFileInDendroDataInDB = null;
                                    uploadedAndDeletedFileInDendroDataInDB = _.find(res, function (resourceInCkan) {
                                        return resourceInCkan.name === uploadedAndDeletedFileInDendroMockFile.name;
                                    });
                                    should.exist(uploadedAndDeletedFileInDendroDataInDB);
                                    done();
                                });
                            }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                        },true);
                    }, true);
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
                    ckanTestUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanDendroDiffsData, function (err, res) {
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
                    ckanTestUtils.getCkanFolderContents(true, agent, {repository: ckanData}, folderExportedCkanCkanDiffsData, function (err, res) {
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

        //The case when there is a file in the dendro package that has a size of zero
        it("Should export the folder  to ckan even when uploading a file with a size of zero to Dendro (this use case caused a bug before, now dendro does not accept files with a size of zero)", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, emptyFileMock, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body[0].message.should.equal("Invalid file size! You cannot upload empty files!");
                    res.body[0].result.should.equal("error");
                    repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                        res.statusCode.should.equal(200);
                        done();
                    }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                });
            });
        });

        //test when uploading/copying/moving/renaming folders/files
        it("Should append the current date if a file with the same name was already uploaded before, however, should not export because the user did not allow dendroPermissions", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //the first time when uploading the file -> does not append the current date to the name
                fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedAndDeletedFileInDendroMockFile, function (err, res) {
                    res.statusCode.should.equal(200);
                    itemUtils.getItemMetadataByUri(true, agent, res.body[0].uri, function (err, res) {
                        res.body.title.should.equal(uploadedAndDeletedFileInDendroMockFile.name);
                        res.body.title.should.not.contain("_Copy_created_");
                        fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedAndDeletedFileInDendroMockFile, function (err, res) {
                            //the second time uploading the file -> should append the date to the name
                            res.statusCode.should.equal(200);
                            itemUtils.getItemMetadataByUri(true, agent, res.body[0].uri, function (err, res) {
                                //checks here that the name is the original name but concatenated with a timestamp
                                res.statusCode.should.equal(200);
                                res.body.title.should.not.equal(uploadedAndDeletedFileInDendroMockFile.name);
                                res.body.title.should.contain("_Copy_created_");
                                repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                    res.statusCode.should.equal(412);
                                    res.body.message.should.contain("Missing the permission: dendroDiffs");
                                    done();
                                }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                            });
                        });
                    });
                });
            });
        });

        //test when uploading/copying/moving/renaming folders/files
        it("Should append the current date if a file with the same name was already uploaded before, and should export because the user did allow dendroPermissions", function (done) {
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedAndDeletedFileInDendroMockFile, function (err, res) {
                    //the second time uploading the file -> should append the date to the name
                    res.statusCode.should.equal(200);
                    itemUtils.getItemMetadataByUri(true, agent, res.body[0].uri, function (err, res) {
                        //checks here that the name is the original name but concatenated with a timestamp
                        res.statusCode.should.equal(200);
                        res.body.title.should.not.equal(uploadedAndDeletedFileInDendroMockFile.name);
                        res.body.title.should.contain("_Copy_created_");
                        repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                            res.statusCode.should.equal(200);
                            done();
                        }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                    });
                });
            });
        });

        it("Should give an error when the user tries to export a file to ckan, as it is only possible to export folders", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, uploadedAndDeletedFileInDendroMockFile, function (err, res) {
                    res.statusCode.should.equal(200);
                    repositoryUtils.exportFolderByUriToRepository(true, res.body[0].uri, agent, {repository: ckanData}, function (err, res) {
                        res.statusCode.should.equal(404);
                        res.body.message.should.equal("The folder to export does not exist in Dendro. Are you sure you selected a folder?");
                        done();
                    }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                });
            });
        });

        it("Should give an error saying that a folder has no content to export", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.createFolderInProjectRoot(true, agent, publicProject.handle, "anEmptyFolder", function (err, res) {
                    res.statusCode.should.equal(200);
                    repositoryUtils.exportFolderByUriToRepository(true, res.body.id, agent, {repository: ckanData}, function (err, res) {
                        res.statusCode.should.equal(412);
                        res.body.message.should.equal("Error, you cannot export an empty folder to Ckan");
                        done();
                    }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                });
            });
        });

        it("Should give an error saying that a folder to export has children folders(ckan does not support this)", function (done) {
            let propagateDendroChangesIntoCkan = false;
            let deleteChangesOriginatedFromCkan = false;
            let aFolderWithFoldersUri;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.createFolderInProjectRoot(true, agent, publicProject.handle, "aFolderWithFolders", function (err, res) {
                    res.statusCode.should.equal(200);
                    aFolderWithFoldersUri = res.body.id;
                    itemUtils.createFolder(true, agent, publicProject.handle, "aFolderWithFolders", "folderInsideAFolder", function (err, res) {
                        res.statusCode.should.equal(200);
                        repositoryUtils.exportFolderByUriToRepository(true, aFolderWithFoldersUri, agent, {repository: ckanData}, function (err, res) {
                            res.statusCode.should.equal(412);
                            res.body.message.should.equal("Error, you can only export folders that have files and not folders.");
                            done();
                        }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                    });
                });
            });
        });

        it("Should export a large txt file of 100 MB(this was previously causing a bug)", function (done) {
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            let aFolderWithFoldersUri;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //TODO generate large txt file -> then upload large txt file to dendro
                //TODO need file md5 and location

                const fs = require('fs');
                const md5File = require("md5-file");
                let hugeTxtFileMock = {
                    name : "hugeTxtFile.txt",
                    extension : "txt",
                    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/") + "hugeTxtFile.txt",
                    sizeGb: 0.1
                };

                fileUtils.initLargeTxtFile(hugeTxtFileMock, function (err, info) {
                    should.not.exist(err);
                    let stats = fs.statSync(hugeTxtFileMock.location);
                    let fileSizeInBytes = stats.size;
                    /*fileSizeInBytes.should.be.above(hugeTxtFileMock.sizeGb * 1000000000);*/
                    expect(fileSizeInBytes).to.be.at.least(hugeTxtFileMock.sizeGb * 1073741824);
                    fs.existsSync(hugeTxtFileMock.location).should.equal(true);
                    hugeTxtFileMock.md5 = md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/") + "hugeTxtFile.txt");
                    fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, hugeTxtFileMock, function (err, res) {
                        res.statusCode.should.equal(200);
                        itemUtils.getItemMetadataByUri(true, agent, res.body[0].uri, function (err, res) {
                            res.statusCode.should.equal(200);
                            repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                res.statusCode.should.equal(200);
                                fileUtils.deleteLargeTxtFile(hugeTxtFileMock, function (err, info) {
                                    should.not.exist(err);
                                    fs.existsSync(hugeTxtFileMock.location).should.equal(false);
                                    done();
                                });
                            }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                        });
                    });
                });
            });
        });

        //TODO this test only passes when it is running individually. Otherwise the test results in a socket hangup error
        /*it("Should not export a package to Ckan that contains a file with a size that is above 500MB", function (done) {
            this.timeout(12000000000000000000);
            let propagateDendroChangesIntoCkan = true;
            let deleteChangesOriginatedFromCkan = false;
            let aFolderWithFoldersUri;
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {

                const fs = require('fs');
                const md5File = require("md5-file");
                let hugeTxtFileMock = {
                    name : "hugeTxtFile.txt",
                    extension : "txt",
                    location : Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/") + "hugeTxtFile.txt",
                    sizeGb: 0.6
                };

                fileUtils.initLargeTxtFile(hugeTxtFileMock, function (err, info) {
                    should.not.exist(err);
                    let stats = fs.statSync(hugeTxtFileMock.location);
                    let fileSizeInBytes = stats.size;
                    /!*fileSizeInBytes.should.be.above(hugeTxtFileMock.sizeGb * 1000000000);*!/
                    expect(fileSizeInBytes).to.be.at.least(hugeTxtFileMock.sizeGb * 1073741824);
                    fs.existsSync(hugeTxtFileMock.location).should.equal(true);
                    hugeTxtFileMock.md5 = md5File.sync(Pathfinder.absPathInApp("/test/mockdata/files/test_uploads/") + "hugeTxtFile.txt");
                    fileUtils.uploadFile(true, agent, publicProject.handle, folderExportedCkanDendroDiffsData.nie.title, hugeTxtFileMock, function (err, res) {
                        res.statusCode.should.equal(200);
                        itemUtils.getItemMetadataByUri(true, agent, res.body[0].uri, function (err, res) {
                            res.statusCode.should.equal(200);
                            repositoryUtils.exportFolderByUriToRepository(true, folderExportedCkanDendroDiffsData.uri, agent, {repository: ckanData}, function (err, res) {
                                res.statusCode.should.equal(500);
                                res.body.message.should.contain("upload too large");
                                fileUtils.deleteLargeTxtFile(hugeTxtFileMock, function (err, info) {
                                    should.not.exist(err);
                                    fs.existsSync(hugeTxtFileMock.location).should.equal(false);
                                    done();
                                });
                            }, propagateDendroChangesIntoCkan, deleteChangesOriginatedFromCkan);
                        });
                    });
                });
            });
        });*/

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
