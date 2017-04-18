var chai = require('chai');
var chaiHttp = require('chai-http');
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

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
require(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js")).setup();

describe("[GET] /projects/my", function () {
    it("[HTML] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllMyProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        });
    });

    it("[HTML] Should not show projects created by demouser1 and where demouser3 does not collaborate when logged in as demouser3", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.listAllMyProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.not.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">");

                res.text.should.not.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");

                res.text.should.not.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">");
                res.text.should.not.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        });
    });

    it("[HTML] Should give error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllMyProjects(false, agent, function (err, res) {
            res.statusCode.should.equal(200);
            res.text.should.contain("<p>Please log into the system.</p>");
            done();
        });
    });

    it("[HTML] Should show all the projects where demouser2 collaborates when demouser2 is logged in", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.listAllMyProjects(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<a href=\"/project/metadataonlyprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/metadataonlyhtmlprojectcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/publicprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/publicprojecthtmlcreatedbydemouser1\">");

                res.text.should.contain("<a href=\"/project/privateprojectcreatedbydemouser1\">");
                res.text.should.contain("<a href=\"/project/privateprojecthtmlcreatedbydemouser1\">");
                done();
            });
        });
    });

    it("[JSON] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.listAllMyProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.contain("publicprojectcreatedbydemouser1");
                res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.contain("privateprojectcreatedbydemouser1");
                res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });
    });

    it("[JSON] Should not show projects created by demouser1 and where demouser3 does not collaborate when logged in as demouser3", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.listAllMyProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.not.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.not.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.not.contain("publicprojectcreatedbydemouser1");
                res.text.should.not.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.not.contain("privateprojectcreatedbydemouser1");
                res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });
    });

    it("[JSON] Should give error when the user is not authenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.listAllMyProjects(true, agent, function (err, res) {
            res.statusCode.should.equal(401);
            res.body.message.should.equal("Action not permitted. You are not logged into the system.");
            done();
        });
    });

    it("[JSON] Should show all the projects where demouser2 collaborates when demouser2 is logged in", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.listAllMyProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                res.text.should.contain("publicprojectcreatedbydemouser1");
                res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                res.text.should.contain("privateprojectcreatedbydemouser1");
                res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                done();
            });
        });
    });

    after(function (done) {
        //destroy graphs
        require(Config.absPathInTestsFolder("utils/db/db.Test.js"));
        done();
    });
});