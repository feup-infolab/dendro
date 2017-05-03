var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder2 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
var deleteFoldersUnit = requireUncached(Config.absPathInTestsFolder("units/folders/deleteFolders.Unit.js"));
var db = requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

describe("Private project testFolder2 level undelete tests", function () {
    before(function (done) {
        this.timeout(60000);
        deleteFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [Private PROJECT] /project/" + privateProject.handle + "/data/:foldername?undelete", function() {
        //API only
        it("Should give an error when the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.undeleteItem(false, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.undeleteItem(true, agent, invalidProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error message when the folder does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.undeleteItem(true, agent, privateProject.handle, notFoundFolder.name, function (err, res) {
                    res.statusCode.should.equal(500);
                    res.body.message.should.contain("Unable to retrieve resource with uri");
                    done();
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);

            itemUtils.undeleteItem(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a folder that is currently deleted", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.undeleteItem(true, agent, privateProject.handle, folderForDemouser2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.undeleteItem(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete a folder that is currently deleted", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.undeleteItem(true, agent, privateProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        })
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        db.deleteGraphs(function (err, data) {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });
});