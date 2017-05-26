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
let demouser1PostURI;

describe("Social Dendro get shares for a post tests", function () {
    before(function (done) {
        this.timeout(60000);
        createSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            demouser1PostURI = results.sharedPostUri;
            done();
        });
    });

    //demouser1PostURIs[4].uri
    describe("[POST] /posts/shares", function () {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getSharesForAPost(false, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should return an error if the user is not logged in", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            postUtils.getSharesForAPost(true, agent, demouser1PostURI, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should return an error if the post that is being queried for shares does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getSharesForAPost(true, agent, "invalidPostID", function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should return an error if the post that is being queried for shares belongs to a project were the demouser3 is not a collaborator or creator", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getSharesForAPost(true, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should return the shares if the post that is being queried for shares belongs to a project were the demouser1 is a collaborator or creator", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getSharesForAPost(true, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(1);
                    res.body[0].ddr.postURI.should.equal(demouser1PostURI);
                    res.body[0].ddr.shareMsg.should.equal(shareMockup.msg);
                    done();
                });
            });
        });

        it("Should return the shares if the post that is being queried for shares belongs to a project were the demouser2 is a collaborator or creator", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.getSharesForAPost(true, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(1);
                    res.body[0].ddr.postURI.should.equal(demouser1PostURI);
                    res.body[0].ddr.shareMsg.should.equal(shareMockup.msg);
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