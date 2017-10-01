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

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
const addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Public project testFolder1 level ?version", function () {
    this.timeout(Config.testsTimeout);
    before(function (done) {
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

        it("Should show the version information even if the user is unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                res.statusCode.should.equal(200);//because it is a public project
                res.body.uri.should.not.equal(null);
                res.body.changes.should.be.instanceof(Array);
                res.body.changes.length.should.equal(3);//The abstract, title and creator descriptors
                should.not.exist(res.body.ddr.versionCreator.ddr.password);
                done();
            });
        });

        it("Should give an error if the project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, invalidProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(testFolder1.name);
                    res.body.message[0].should.contain(invalidProject.handle);
                    done();
                });
            });
        });

        it("Should give an error if the folder identified by foldername does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, notFoundFolder.name, notFoundFolder.version, function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(notFoundFolder.name);
                    res.body.message[0].should.contain(publicProject.handle);
                    done();
                });
            });
        });

        it("Should give the version info if the user is logged in as demouser2(collaborator of the project)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, folderForDemouser2.name, folderForDemouser2.version, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.not.equal(null);
                    res.body.changes.should.be.instanceof(Array);
                    res.body.changes.length.should.equal(3);
                    should.not.exist(res.body.ddr.versionCreator.ddr.password);
                    done();
                });
            });
        });

        it("Should give the folder versions if the folder exists and if the user is logged in as demouser1(the creator of the project)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.not.equal(null);
                    res.body.changes.should.be.instanceof(Array);
                    res.body.changes.length.should.equal(3);
                    should.not.exist(res.body.ddr.versionCreator.ddr.password);
                    done();
                });
            });
        });

        it("Should give the folder versions if the folder exists and if the user is logged in as demouser3(not a creator or  collaborator on the project)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, testFolder1.version, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.not.equal(null);
                    res.body.changes.should.be.instanceof(Array);
                    res.body.changes.length.should.equal(3);
                    should.not.exist(res.body.ddr.versionCreator.ddr.password);
                    done();
                });
            });
        });

        it("Should give an error if no version is specified", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemVersion(true, agent, publicProject.handle, testFolder1.name, null, function (err, res) {
                    res.statusCode.should.equal(405);
                    done();
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