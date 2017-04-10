var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Config.absPathInTestsFolder("utils/http/httpUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicproject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));

const folder = require(Config.absPathInTestsFolder("mockdata/folders/folder.js"));
const folderForDemouser2 = require(Config.absPathInTestsFolder("mockdata/folders/folderDemoUser2.js"));
require(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js")).setup();

describe("[POST] /project/:handle?mkdir " + publicproject.handle, function () {

    /*
    before(function(done){
        require(Config.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js")).setup(done);
    });*/

    it("Should give an error if an invalid project is specified, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, "invalidProjectHandle", folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should give an error if the request for this route is of type HTML", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(false, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(400);
                res.text.should.equal("HTML Request not valid for this route.");
                done();
            });
        });
    });


    it("Should give an error when the user is unauthenticated", function (done) {
        var app = GLOBAL.tests.app;
        var agent = chai.request.agent(app);
        projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
            res.statusCode.should.equal(401);
            done();
        });
    });

    it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done) {
        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folder.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done) {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, folderForDemouser2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.result.should.equal("ok");
                done();
            });
        });
    });

    it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done) {
        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
            projectUtils.createFolderInProjectRoot(true, agent, publicproject.handle, "thisIsAn*InvalidFolderName", function (err, res) {
                res.statusCode.should.equal(500);
                res.body.message.should.equal("invalid file name specified");
                done();
            });
        });
    });
});