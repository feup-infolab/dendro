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

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Config.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));

const addContributorsToProjectsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));

describe("My Projects", function (done) {
    before(function (done) {
        this.timeout(60000);
        addContributorsToProjectsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects/my", function () {
        it("[HTML] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.listAllMyProjects(false, agent, function (err, res) {
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

        it("[HTML] Should not show projects created by demouser1 and where demouser3 does not collaborate when logged in as demouser3", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.listAllMyProjects(false, agent, function (err, res) {
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

        it("[HTML] Should give error when the user is not authenticated", function (done) {
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
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
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
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