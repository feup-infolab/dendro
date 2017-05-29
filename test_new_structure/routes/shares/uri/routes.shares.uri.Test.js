var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const repositoryUtils = require(Config.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
const postUtils = require(Config.absPathInTestsFolder("utils/social/post.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));
const shareMockup = require(Config.absPathInTestsFolder("mockdata/social/share.js"));

var createSharesUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/social/createShares.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
let demouser1ShareURI;

describe("Social Dendro, render a share post page tests", function () {
    before(function (done) {
        this.timeout(60000);
        createSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    let demouser1ShareObject = _.find(res.body, function (socialElement) {return socialElement.uri.indexOf("shares") !== -1;});
                    demouser1ShareURI = demouser1ShareObject.uri.split("http://" + Config.host).pop();//because the implementation is wrong, this needs changing, the url sent should be the full version
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    describe("[GET] /shares/:uri", function () {
        //HTML ONLY
        it("Should give an error if the request type for this route is of type JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAShareInfo(true, agent, demouser1ShareURI, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.text.should.not.contain(demouser1ShareURI);
                    done();
                });
            });
        });

        it("Should return an error if the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            postUtils.getAShareInfo(false, agent, demouser1ShareURI, function (err, res) {
                res.statusCode.should.equal(401);
                res.text.should.not.contain(demouser1ShareURI);
                done();
            });
        });

        it("Should an error if the share uri does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAShareInfo(false, agent, "/shares/anInvalidPostURL", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.text.should.not.contain(demouser1ShareURI);
                    done();
                });
            });
        });

        it("Should return an error if the share uri does not belong to projects where the demouser3 is a creator or collaborator", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getAShareInfo(false, agent, demouser1ShareURI, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.text.should.not.contain(demouser1ShareURI);
                    done();
                });
            });
        });

        it("Should return a page with info about a share if the user is logged in as demouser1 and the share originates from projects created by demouser1 or where he collaborates", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAShareInfo(false, agent, demouser1ShareURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain(demouser1ShareURI);
                    done();
                });
            });
        });

        it("Should return a page with info about a share if the user is logged in as demouser2 and the share originates from projects created by demouser2 or where he collaborates", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.getAShareInfo(false, agent, demouser1ShareURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain(demouser1ShareURI);
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