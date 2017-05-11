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

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const testFolder2 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
var createFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Public project testFolder2 level ?mkdir", function () {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [FOLDER LEVEL] [PUBLIC PROJECT] /project/" + publicProject.handle + "/data/:foldername?mkdir", function () {
        it("Should give an error if the request is of type HTML even if the user is logged in as demouser1(the creator of the project)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.createFolder(false, agent, publicProject.handle, testFolder2.name, folder.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.text.should.equal("HTML Request not valid for this route.");
                    done();
                });
            });
        });

        it("Should give an error when the user is unauthenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            itemUtils.createFolder(true, agent, publicProject.handle, testFolder2.name, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser3(not a collaborador nor creator in a project by demouser1)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder2.name, folder.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder2.name, folder.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder2.name, folderForDemouser2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.createFolder(true, agent, publicProject.handle, testFolder2.name, "*aRandomFolder", function (err, res) {
                    res.statusCode.should.equal(500);
                    res.body.message.should.equal("invalid file name specified");
                    done();
                });
            });
        });

        it("Should give an error if an invalid folder parent is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.createFolder(true, agent, publicProject.handle, "*invalidFolder", folder.name, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });

        it("Should give an error if an invalid project is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.createFolder(true, agent, "unKnownProjectHandle", testFolder2.name, folder.name, function (err, res) {
                    res.statusCode.should.equal(401);
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