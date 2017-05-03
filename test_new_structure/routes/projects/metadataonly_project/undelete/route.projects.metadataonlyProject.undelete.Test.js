var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Config.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Config.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const metadataProjectHTMLTests = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"))

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));

var db = requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
var deleteProjectsUnit = requireUncached(Config.absPathInTestsFolder("units/projects/deleteProjects.Unit.js"));

function requireUncached(module) {
    delete require.cache[require.resolve(module)]
    return require(module)
}

describe("Undelete metadata only Project Tests", function () {
    before(function (done) {
        this.timeout(60000);
        deleteProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[JSON] [POST] /project/:handle/undelete", function () {
        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.undeleteProject(true, agent, "ARandomProject", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Unable to find project with handle : " + "ARandomProject");
                    done();
                });
            })
        });

        it("Should give an error when the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.undeleteProject(true, agent, metadataProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a project created by demouser1 that is currently deleted", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.undeleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                    done();
                });
            })
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete the project that is currently deleted", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.undeleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                    done();
                });
            })
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete the project that is currently deleted", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.undeleteProject(true, agent, metadataProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.message[0].should.equal("Project " + metadataProject.handle + " successfully recovered");
                    done();
                });
            })
        })
    });

    describe("[HTML] [POST] /project/:handle/undelete", function () {

        it("Should give an error message when a project does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.undeleteProject(false, agent, "ARandomProject", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Unable to find project with handle : " + "ARandomProject");
                    done();
                });
            })
        });

        it("Should give an error when the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.undeleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to undelete a project created by demouser1 that is currently deleted", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.undeleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<p>Please log into the system.</p>");
                    done();
                });
            })
        });

        it("Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to undelete the project that is currently deleted", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.undeleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<p>Please log into the system.</p>");
                    done();
                });
            })
        });

        it("Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to undelete the project that is currently deleted", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.undeleteProject(false, agent, metadataProjectHTMLTests.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("This is a metadata only test project with handle metadataonlyhtmlprojectcreatedbydemouser1 and created by demouser1");
                    res.text.should.not.contain("<p>Please log into the system.</p>");
                    res.text.should.not.contain("This is a metadata only test project with handle metadataonlyhtmlprojectcreatedbydemouser1 and created by demouser1 Creator Deleted");
                    done(); 
                });
            })
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