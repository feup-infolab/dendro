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

const testFolder1 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
var addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Public project testFolder1 level ?version", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] [PUBLIC PROJECT] /project/" + publicProject.handle  + "/data/foldername?version", function () {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(false, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should show the version information if the user is unauthenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);

            itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                res.statusCode.should.equal(200);//because it is a public project
                res.body.descriptors.length.should.equal(6);
                done();
            });
        });

        it("Should give an error if the project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, invalidProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });

        it("Should give an error if the folder identified by foldername does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, notFoundFolder.name, notFoundFolder.version, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });

        it("Should give the version info if the user is logged in as demouser2(collaborator of the project)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, folderForDemouser2.name, folderForDemouser2.version, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.length.should.equal(6);
                    done();
                });
            });
        });

        it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.length.should.equal(6);
                    done();
                });
            });
        });

        it("Should give the folder versions if the folder exists and if the user is logged in as demouser3(not a creator or  collaborator on the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(200);//because this is a public project
                    res.body.descriptors.length.should.equal(6);
                    done();
                });
            });
        });

        it("Should give an error if no version is specified", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, null, function (err, res) {
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        })
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