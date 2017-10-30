const chai = require("chai");
const async = require("async");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let agent;
let app;

describe("Metadata Only Project delete", function (done) {
    this.timeout(2*Config.testsTimeOut);
    before(function (done) {
        createFilesUnit.setup(function (err, results) {
            should.equal(err, null);
            app = global.tests.app;
            agent = chai.request.agent(app);
            done();
        });
    });


    describe("[Invalid Cases] /project/:handle?delete " + metadataOnlyProject.handle, function () {

        it("Should give an error if an invalid project is specified", function (done) {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, "invalidProjectHandle", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.text.should.contain("Resource not found at uri ");
                    res.text.should.contain("invalidProjectHandle");
                    done();
                });
            });
        });

        it("Should give an error if the request for this route is of type JSON", function (done) {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, metadataOnlyProject.handle, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.text.should.contain("API Request not valid for this route.");
                    done();
                });
            });
        });


        it("Should give an error when the user is unauthenticated", function (done) {
            this.timeout(Config.testsTimeout);
            projectUtils.deleteProject(false, agent, metadataOnlyProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser3 (not a collaborator nor creator in a project by demouser1)", function (done) {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.deleteProject(false, agent, metadataOnlyProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    describe("[Valid Cases] /project/:handle?delete " + metadataOnlyProject.handle, function () {
        it("Should delete the project if the user is logged in as demouser1 (creator of the project)", function (done) {
            this.timeout(Config.testsTimeout);

            const fileCountsBefore = {};
            const tripleCountsBefore = {};
            let deletedProjectUris = {};

            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                should.equal(err, null);

                async.mapSeries(createProjectsUnit.projectsData, function(aProject, callback){
                    projectUtils.getProjectUriFromHandle(agent, aProject.handle, function(err, projectUri){
                        deletedProjectUris[aProject.handle] = projectUri;
                        should.equal(null, err);

                        projectUtils.countProjectTriples(projectUri, function(err, tripleCount){
                            should.equal(err, null);
                            tripleCountsBefore[projectUri] = tripleCount;
                            projectUtils.countProjectFilesInGridFS(projectUri, function(err, fileCount)
                            {
                                should.equal(err, null);
                                fileCountsBefore[projectUri] = fileCount;
                                callback(err);
                            });
                        });
                    });
                }, function(err, results){
                    should.equal(err, null);
                    projectUtils.deleteProject(false, agent, metadataOnlyProject.handle, function (err, res) {
                        res.statusCode.should.equal(200);

                        async.mapSeries(createProjectsUnit.projectsData, function(aProject, callback){
                            let projectUri = deletedProjectUris[aProject.handle];
                            projectUtils.countProjectTriples(projectUri, function(err, tripleCount, results){
                                should.equal(err, null);

                                if(aProject.handle === metadataOnlyProject.handle)
                                {
                                    tripleCount.should.equal(0);
                                }
                                else
                                {
                                    tripleCount.should.equal(tripleCountsBefore[deletedProjectUris[aProject.handle]]);
                                }

                                projectUtils.countProjectFilesInGridFS(projectUri, function(err, fileCount)
                                {
                                    should.equal(err, null);
                                    if(aProject.handle === metadataOnlyProject.handle)
                                    {
                                        fileCount.should.equal(0);
                                    }
                                    else
                                    {
                                        fileCount.should.equal(fileCountsBefore[projectUri]);
                                    }

                                    callback(err, fileCount);
                                });
                            });
                        }, function(err, results){
                            done(err);
                        });
                    });
                });
            });
        });
    });

     after(function (done) {
        //destroy graphs

        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done(err);
        });
    });
});