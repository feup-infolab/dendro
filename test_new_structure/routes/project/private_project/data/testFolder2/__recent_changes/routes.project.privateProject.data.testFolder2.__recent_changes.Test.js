var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder2 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
var addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Private project testFolder2 level recent changes", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    //GET ITEM RECENT CHANGES TESTS
    describe("[GET] [PRIVATE PROJECT] /project/"+ privateProject.handle + "/data/foldername?recent_changes", function () {
        //API ONLY
        it("Should give an error if the request is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemRecentChanges(false, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error if the user is unauthenticated", function (done) {
            var app = GLOBAL.tests.app;
            agent = chai.request.agent(app);

            itemUtils.getItemRecentChanges(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                //because it is a private project
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error if the project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemRecentChanges(true, agent, invalidProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give an error if the folder does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemRecentChanges(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give an error if the user is logged in as demouser3(not a collaborator nor creator of the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.getItemRecentChanges(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give the folder changes if the user is logged in as demouser1(the creator of the project)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemRecentChanges(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body[0].changes.length.should.equal(3);//The abstract, title and creator descriptors
                    done();
                });
            });
        });

        it("Should give the folder changes if the user is logged in as demouser2(a collaborator on the project)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.getItemRecentChanges(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body[0].changes.length.should.equal(1);//The abstract
                    done();
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});