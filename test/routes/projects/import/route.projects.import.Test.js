const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
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

const projectBackupData = require(Config.absPathInTestsFolder("mockdata/projects/projectBackups/publicProject"));

const bootup = appUtils.requireUncached(Config.absPathInTestsFolder("units/bootup.Unit.js"));
const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Import projects tests", function (done) {
    this.timeout(20000);
    before(function (done) {
        bootup.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects/import", function () {
        it("Should get an error when trying to access the html page to import a project when unauthenticated", function (done) {
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("Should get the html import a project page when logged in as any user", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.importProjectHTMLPage(false, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<h1 class=\"page-header\">\n    Import a project\n</h1>");
                    done();
                });
            });
        });

        it("[JSON] Should give an error if the request for this route is of type JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
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
            const app = GLOBAL.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProject(true, agent, projectBackupData.path, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give a status code of 200 when the user is logged in and the zip file used to import the project is not corrupted", function (done) {
            done(1);
        });

        it("Should give an error with a status code of 500 when the zip file used to import the project is corrupted even thought the user is logged in", function (done) {
            done(1);
        });

        it("[HTML] Should give an error if the request type for this route is the HTML type", function (done) {
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