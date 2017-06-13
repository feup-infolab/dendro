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
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
var addContributorsToProjectsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

//LIST ALL PROJECTS
describe("List all projects tests", function (done) {
    before(function (done) {
        this.timeout(60000);
        addContributorsToProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects", function () {
        it("[HTML] Should only get public and metadata_only projects when unauthenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);

            projectUtils.listAllProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
                done();
            });
        });

        it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 when logged in as demouser1(CREATOR)", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                    res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                    res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
                    done();
                });
            });
        });

        it("[HTML] Should get all public and metadata_only projects as well as private_projects created by demouser1 where demouser2 collaborates when logged in as demouser2(COLLABORATOR WITH DEMOUSER1 ON DEMOUSER1 PROJECTS)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                    res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                    res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
                    done();
                });
            });
        });

        it("[HTML] Should only get public and metadata_only projects and not private projects created by demouser1 when logged in as demouser3(NOR CREATOR NOR COLLABORATOR)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, res) {
                projectUtils.listAllProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">metadataonlyprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">metadataonlyhtmlprojectcreatedbydemouser1</a>");

                    res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">publicprojectcreatedbydemouser1</a>");
                    res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">publicprojecthtmlcreatedbydemouser1</a>");

                    res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">privateprojectcreatedbydemouser1</a>");
                    res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">privateprojecthtmlcreatedbydemouser1</a>");
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
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});