const chai = require("chai");
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
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

//LIST ALL PROJECTS
describe("List all projects tests", function (done) {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        addContributorsToProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects", function () {
        it("[HTML] Should only get public and metadata_only projects when unauthenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            projectUtils.listAllProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.contain("publicprojectcreatedbydemouser1");
                res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.not.contain("privateprojectcreatedbydemouser1");
                res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });

        it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 when logged in as demouser1(CREATOR)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 where demouser2 collaborates when logged in as demouser2(COLLABORATOR WITH DEMOUSER1 ON DEMOUSER1 PROJECTS)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[HTML] Should only get public and metadata_only projects and not private projects created by demouser1 when logged in as demouser3(NOR CREATOR NOR COLLABORATOR)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, res) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1");

                    res.text.should.not.contain("privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1");
                    res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.listAllProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("API Request not valid for this route.");
                    done();
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