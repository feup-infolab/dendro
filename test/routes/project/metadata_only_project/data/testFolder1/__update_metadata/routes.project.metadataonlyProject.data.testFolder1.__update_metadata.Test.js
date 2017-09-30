const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Metadata only project testFolder1 level update_metadata", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        createFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [METADATA ONLY PROJECT] /project/" + metadataProject.handle + "/data/:foldername?update_metadata", function() {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.updateItemMetadata(false, agent, metadataProject.handle, testFolder1.name, testFolder1.metadata, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, invalidProject.handle, testFolder1.name, testFolder1.metadata, function (err, res) {
                    res.statusCode.should.equal(404);
                    //jsonOnly, agent, projectHandle, itemPath, cb
                    itemUtils.getItemMetadata(true, agent, invalidProject.handle, testFolder1.name, function (error, response) {
                        response.statusCode.should.equal(404);
                        done();
                    });
                });
            });
        });

        it("Should give an error message when the folder does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, metadataProject.handle, notFoundFolder.name, testFolder1.metadata, function (err, res) {
                    res.statusCode.should.equal(404);
                    //jsonOnly, agent, projectHandle, itemPath, cb
                    itemUtils.getItemMetadata(true, agent, metadataProject.handle, notFoundFolder.name, function (error, response) {
                        response.statusCode.should.equal(404);
                        done();
                    });
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.updateItemMetadata(true, agent, metadataProject.handle, testFolder1.name, testFolder1.metadata, function (err, res) {
                res.statusCode.should.equal(401);
                itemUtils.getItemMetadata(true, agent, metadataProject.handle, testFolder1.name, function (error, response) {
                    response.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error when an invalid descriptor is used to update the metadata of a folder", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, metadataProject.handle, testFolder1.name, testFolder1.invalidMetadata, function (err, res) {
                    res.statusCode.should.equal(400);
                    itemUtils.getItemMetadata(true, agent, metadataProject.handle, testFolder1.name, function (error, response)
                    {
                        response.statusCode.should.equal(200);
                        descriptorUtils.noPrivateDescriptors(JSON.parse(response.text).descriptors).should.equal(true);
                        done();
                    });
                });
            });
        });

        it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to update a metadata of a folder with a valid descriptor", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, metadataProject.handle, folderForDemouser2.name, folderForDemouser2.metadata, function (err, res) {
                    res.statusCode.should.equal(200);
                    //jsonOnly, agent, projectHandle, itemPath, cb
                    itemUtils.getItemMetadata(true, agent, metadataProject.handle, folderForDemouser2.name, function (error, response) {
                        response.statusCode.should.equal(200);
                        descriptorUtils.noPrivateDescriptors(JSON.parse(response.text).descriptors).should.equal(true);
                        descriptorUtils.containsAllMetadata(folderForDemouser2.metadata, JSON.parse(response.text).descriptors).should.equal(true);
                        done();
                    });
                });
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, metadataProject.handle, testFolder1.name, testFolder1.metadata, function (err, res) {
                    res.statusCode.should.equal(401);
                    //jsonOnly, agent, projectHandle, itemPath, cb
                    itemUtils.getItemMetadata(true, agent, metadataProject.handle, testFolder1.name, function (error, response) {
                        response.statusCode.should.equal(401);
                        done();
                    });
                });
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to update a metadata of a folder with a valid descriptor", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.updateItemMetadata(true, agent, metadataProject.handle, testFolder1.name, testFolder1.metadata, function (err, res) {
                    res.statusCode.should.equal(200);
                    //jsonOnly, agent, projectHandle, itemPath, cb
                    itemUtils.getItemMetadata(true, agent, metadataProject.handle, testFolder1.name, function (error, response) {
                        response.statusCode.should.equal(200);
                        descriptorUtils.noPrivateDescriptors(JSON.parse(response.text).descriptors).should.equal(true);
                        descriptorUtils.containsAllMetadata(testFolder1.metadata, JSON.parse(response.text).descriptors).should.equal(true);
                        done();
                    });
                });
            });
        })
    });

    after(function (done) {
        //destroy graphs

        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done(err);
        });
    });
});