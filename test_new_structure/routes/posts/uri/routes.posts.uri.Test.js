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

describe("Social Dendro, render a post page tests", function () {
    before(function (done) {
        this.timeout(60000);
        createPostsUnit.setup(function (err, results) {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    demouser1PostURI = res.body[0].uri.split("http://" + Config.host).pop();
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });
    });

    describe("[GET] /posts/:uri", function () {
        //HTML ONLY
        it("Should give an error if the request type for this route is JSON", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getPostHTMLPageWithInfo(true, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should return an error if the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            postUtils.getPostHTMLPageWithInfo(false, agent, demouser1PostURI, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should not return any post info page if the post url is invalid", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getPostHTMLPageWithInfo(false, agent, "/posts/anInvalidPostURL", function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should return an error if the post is from a project where demouser3 is not a creator or collaborator", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getPostHTMLPageWithInfo(false, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.text.should.not.contain(demouser1PostURI);
                    done();
                });
            });
        });

        it("Should return a page with info about a post if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getPostHTMLPageWithInfo(false, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain(demouser1PostURI);
                    done();
                });
            });
        });

        it("Should return a page with info about a post if the user is logged in as demouser2 and the post is originated from metadata work from projects created by demouser2 or where he collaborates", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.getPostHTMLPageWithInfo(false, agent, demouser1PostURI, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.text.should.contain(demouser1PostURI);
                    done()
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