const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const postUtils = require(Pathfinder.absPathInTestsFolder("utils/social/post.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const createLikesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createLikes.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
let demouser1PostURIs;

describe("Social Dendro get likes info for a post tests", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        createLikesUnit.setup(function (err, results) {
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

    //demouser1PostURIs[0].uri
    describe("[POST] /posts/post/likesInfo", function () {
        //API ONLY
        it("Should give an error if the request type for this route is HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getLikesInfoForAPost(false, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should return an error if the user is not logged in", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            postUtils.getLikesInfoForAPost(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should return an error if the post that is being queried to see which users like it does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getLikesInfoForAPost(true, agent, "invalidPostUri", function (err, res) {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should return an error if the post that is being queried to see which users like it belongs to a project were the demouser3 is not a collaborator or creator", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getLikesInfoForAPost(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should return a success message if the post that is being queried to see which users like it belongs to a project were the demouser1 is a collaborator or creator", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getLikesInfoForAPost(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.numLikes.should.equal(1);
                    res.body.postURI.should.equal(demouser1PostURIs[0].uri);
                    res.body.usersWhoLiked.length.should.equal(1);
                    res.body.usersWhoLiked[0].should.contain(demouser2.username);
                    done();
                });
            });
        });

        it("Should return a success message if the post that is being queried to see which users like it belongs to a project were the demouser2 is a collaborator or creator", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.getLikesInfoForAPost(true, agent, demouser1PostURIs[0].uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.numLikes.should.equal(1);
                    res.body.postURI.should.equal(demouser1PostURIs[0].uri);
                    res.body.usersWhoLiked.length.should.equal(1);
                    res.body.usersWhoLiked[0].should.contain(demouser2.username);
                    done();
                });
            });
        });
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