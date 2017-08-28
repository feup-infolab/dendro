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
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/files/createFiles.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let agent;
let app;

describe("Private Project delete", function (done) {
    before(function (done) {
        createFilesUnit.setup(function (err, results) {
            should.equal(err, null);
            app = global.tests.app;
            agent = chai.request.agent(app);
            done();
        });
    });

    beforeEach(function(done){
        this.timeout(Config.longTestsTimeout);
        done();
    });

    describe("[Invalid Cases] /project/:handle?delete " + privateProject.handle, function () {

        it("Should give an error if an invalid project is specified", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, "invalidProjectHandle", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal("not_found");
                    done();
                });
            });
        });

        it("Should give an error if the request for this route is of type JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.deleteProject(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.text.should.equal("API Request not valid for this route.");
                    done();
                });
            });
        });


        it("Should give an error when the user is unauthenticated", function (done) {
            projectUtils.deleteProject(false, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.createFolderInProjectRoot(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    describe("[Valid Cases] /project/:handle?delete " + privateProject.handle, function () {

    });

    after(function (done) {
        //destroy graphs
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});