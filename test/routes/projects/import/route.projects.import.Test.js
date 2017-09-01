const chai = require("chai");
const async = require("async");
const chaiHttp = require("chai-http");
const should = chai.should();
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const createUsersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));

//const projectsData = [publicProject, privateProject, metadataOnlyProject];
const projectsData = [publicProject];

const bootup = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Import projects tests", function (done) {
    this.timeout(Config.testsTimeout);
    before(function (done) {
        createUsersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects/import", function () {
        it("Should get an error when trying to access the html page to import a project when unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
                res.statusCode.should.equal(401);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("Should get the html import a project page when logged in as any user", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                should.equal(err, null);
                projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<h1 class=\"page-header\">\n    Import a project\n</h1>");
                    done();
                });
            });
        });

        it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                should.equal(err, null);
                projectUtils.importProjectHTMLPage(true, agent, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("API Request not valid for this route.");
                    done();
                });
            });
        });
    });

    describe("[POST] /projects/import", function () {
        //TODO API ONLY
        it("Should give an error when the user is not authenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProject(true, agent, privateProject.backup_path, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should import all projects correctly when the user is logged in and the zip file used to import the project is not corrupted", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                should.equal(err, null);

                async.map(projectsData, function(projectData, callback){
                    projectUtils.importProject(true, agent, projectData.backup_path, function (err, res) {
                        should.equal(err, null);
                        res.statusCode.should.equal(200);

                        projectUtils.bagit(agent, projectData.handle, function (err, res) {
                            should.equal(err, null);
                            res.statusCode.should.equal(200);

                            projectUtils.contentsMatchBackup(projectData, res.body, function(err, result){
                                should.equal(err, null);
                                projectUtils.metadataMatchesBackup(projectData, res.body, function(err, result){
                                    should.equal(err, null);
                                    callback(err, res);
                                });
                            });
                        });
                    });
                }, function(err, results){
                    done(err);
                });
            });
        });

        it("Should give an error with a status code of 400 when the zip file used to import the project specifies children in the metadata file when the node is a file (which cannot have children)", function (done) {
            done(1);
        });

        it("Should give an error with a status code of 400 when the zip file used to import the project specifies unparametrized metadata in the metadata.json file", function (done) {
            done(1);
        });

        it("Should give an error with a status code of 400 when the zip file used to import the project is not in a correct BagIt Format, even though the user is logged in", function (done) {
            done(1);
        });

        it("Should give an error with a status code of 400 when the zip file used to import the project contains a wrong nie:title in the metadata section (title does not match the title of the folder that it refers to", function (done) {
            done(1);
        });

        it("Should give an error with a status code of 400 when the zip file used to import the project contains a wrong nie:title in the metadata section (title does not match the title of the file that it refers to", function (done) {
            done(1);
        });
    });

    after(function (done) {
        //destroy graphs
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});