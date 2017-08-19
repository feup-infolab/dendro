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

const createPostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createPosts.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Social Dendro get all user posts tests", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        createPostsUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] [GET ALL USER POSTS] /posts/all", function () {
        //TODO API ONLY
        let postsURISDemouser1;

        it("Should return an error if the user is not authenticated", function (done) {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.should.not.be.instanceof(Array);
                done();
            });
        });

        it("Should return an error if the request is of type HTML", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(false, agent, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("Should get posts URIs generated from projects where demouser1 is a creator or contributor", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(5);
                    postsURISDemouser1 = res.body;
                    done();
                });
            });
        });

        it("Should give no post URIs when logged in as demouser3 because demouser3 has no projects created or were he/she is a contributor", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(0);
                    done();
                });
            });
        });
        
        it("Should give the same postURIs for demouser2 as demouser1 because demouser2 is a contributor for the projects created by demouser1", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                postUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    res.body.length.should.equal(5);
                    res.body.should.be.eql(postsURISDemouser1);
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