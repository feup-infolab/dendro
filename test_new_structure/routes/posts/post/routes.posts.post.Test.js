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

var createPostsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/social/createPosts.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));
let demouser1PostURIs;

describe("Social Dendro get specific post info tests", function () {
    before(function (done) {
        this.timeout(60000);
        createPostsUnit.setup(function (err, results) {
            should.equal(err, null);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    demouser1PostURIs = res.body;
                    done();
                });
            });
        });
    });

    describe("[POST] /posts/post", function () {
        //TODO API ONLY
        //TODO this route makes no sense & needs to be changed in the future
        it("Should give an error if the request type for this route is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAPostInfo(false, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should return an error if the user is not authenticated", function (done) {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);

            postUtils.getAPostInfo(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should return an error if the post uri is pointing to a post that does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAPostInfo(true, agent, "an invalid post ID", function (err, res) {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid post uri");
                    done();
                });
            });
        });

        it("Should give an error if the logged in user is demouser3 and the post uri is from an project where demouser3 is not a creator or collaborator", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getAPostInfo(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(401);
                    //TODO the post info is being shown to a user that is not a collaborator or creator, this cannot happen
                    done();
                });
            });
        });

        it("Should return info about a post if the user is logged in as demouser1 and the post is originated from metadata work from projects created by demouser1 or where he collaborates", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAPostInfo(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.equal(demouser1PostURIs[0].uri);
                    done();
                });
            });
        });

        it("Should return info about a post if the user is logged in as demouser2 and the post is originated from metadata work from projects created by demouser2 or where he collaborates", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAPostInfo(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.equal(demouser1PostURIs[0].uri);
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