const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Config = global.Config;

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Config.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Config.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const metadataProjectHTMLTests = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"))

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));

const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
const createProjectsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

describe("Delete Metadata only Project Tests", function () {
    before(function (done) {
        this.timeout(60000);
        createProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[JSON] [POST] /project/:handle?delete", function () {
        //TODO HTML AND API
        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, "aRandomProjectHandle", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri");
                    res.body.message[0].should.contain("aRandomProjectHandle");
                    done();
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.deleteProject(true, agent, metadataProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                res.text.should.contain("Permission denied : cannot delete project because you do not have permissions to administer this project.");
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a project created by demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the project", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the project", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.message[0].should.equal("Project " + metadataProject.handle + " successfully marked as deleted");
                    done();
                });
            });
        })
    });

    describe("[HTML] [POST] /project/:handle/delete", function () {
        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, "aRandomProjectHandle", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.text.should.contain("Resource not found at uri");
                    res.text.should.contain("aRandomProjectHandle");
                    done();
                });
            });
        });

        it("Should give an error when the user is not authenticated", function (done) {
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.deleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                res.statusCode.should.equal(401);
                res.text.should.contain("Permission denied : cannot delete project because you do not have permissions to administer this project.");
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a project created by demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.text.should.contain("Permission denied : cannot delete project because you do not have permissions to administer this project.");
                    done();
                });
            });
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the project", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.text.should.contain("Permission denied : cannot delete project because you do not have permissions to administer this project.");
                    done();
                });
            });
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the project", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.not.contain("Permission denied : cannot delete project because you do not have permissions to administer this project.");
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