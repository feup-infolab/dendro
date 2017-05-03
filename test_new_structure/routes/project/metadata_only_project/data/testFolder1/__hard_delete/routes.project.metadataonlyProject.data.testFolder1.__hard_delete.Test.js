var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2"));
var createFoldersUnit = requireUncached(Config.absPathInTestsFolder("units/folders/createFolders.Unit.js"));
var db = requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

describe("Metadata only project testFolder1 level hard delete tests", function () {
    before(function (done) {
        this.timeout(60000);
        createFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[DELETE] [METADATA ONLY PROJECT] HARD DELETE /project/" + metadataProject.handle + "/data/:foldername", function () {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.deleteItem(false, agent, metadataProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                }, true);
            });
        });

        it("Should give an error message when the project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                }, true);
            });
        });

        it("Should give an error message when the folder does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, metadataProject.handle, notFoundFolder.name, function (err, res) {
                    res.statusCode.should.equal(500);
                    res.body.message.should.contain("Unable to retrieve resource");
                    done();
                }, true);
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            //jsonOnly, agent, projectHandle, itemPath, cb
            itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            }, true);
        });

        it("Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to hard delete a folder created by demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, metadataProject.handle, folderForDemouser2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    projectUtils.getProjectRootContent(true, agent, metadataProject.handle, function (err, response) {
                        response.statusCode.should.equal(200);
                        response.text.should.not.contain("\"title\":" + "\"" + folderForDemouser2.name + "\"");
                        done();
                    });
                }, true);
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to hard delete the folder", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                }, true);
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to hard delete the folder", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                //jsonOnly, agent, projectHandle, itemPath, cb
                itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    projectUtils.getProjectRootContent(true, agent, metadataProject.handle, function (err, response) {
                        response.statusCode.should.equal(200);
                        response.text.should.not.contain("\"title\":" + "\"" + testFolder1.name + "\"");
                        done();
                    });
                }, true);
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