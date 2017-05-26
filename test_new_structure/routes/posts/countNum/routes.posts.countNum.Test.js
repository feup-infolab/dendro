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

var createPostsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/social/createPosts.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
let demouser1PostURI;

describe("Social Dendro, get number of posts from user's projects tests", function () {
    before(function (done) {
        this.timeout(60000);
        createPostsUnit.setup(function (err, results) {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    describe("[GET] /posts/countNum", function () {
        //API ONLY
        //TODO maybe this route needs to be changed

        it("Should give an error if the request type for this route is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.countNumPostInDB(false, agent, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should return an error if the user is not logged in", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            postUtils.countNumPostInDB(true, agent, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should return the number of posts in the database if the demouser1 is logged in", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.countNumPostInDB(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.equal("24");
                    done();
                });
            });
        });

        it("Should return the number of posts in the database if the demouser2 is logged in(a collaborator of demouser1)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.countNumPostInDB(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.equal("24");
                    done();
                });
            });
        });

        it("Should return the zero posts in the database if the demouser3 is logged in(has no projects)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.countNumPostInDB(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.equal(0);
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