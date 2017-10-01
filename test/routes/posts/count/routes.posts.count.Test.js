const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
const async = require("async");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const fileUtils = require(Pathfinder.absPathInTestsFolder("utils/file/fileUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("utils/item/itemUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const versionUtils = require(Pathfinder.absPathInTestsFolder("utils/versions/versionUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js"));

let numberOfPostsForDemouser1Timeline;

describe("Get the number of posts of a specific user timeline tests", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        //creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Get the number of posts of a specific user timeline /posts/count", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            const app = global.tests.app;
            agent = chai.request.agent(app);
            socialDendroUtils.getTotalPostsForAUsersSocialDendroTimeline(true, agent, function (err, res) {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("[For demouser1, as the creator of all projects] Should give x number of posts for the demouser1 timeline", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getTotalPostsForAUsersSocialDendroTimeline(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    parseInt(res.body).should.equal(120);
                    numberOfPostsForDemouser1Timeline = res.body;
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give x number of posts for the demouser2 timeline(because demouser2 collaborates in all projects created by demouser1)", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                socialDendroUtils.getTotalPostsForAUsersSocialDendroTimeline(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    parseInt(res.body).should.equal(120);
                    numberOfPostsForDemouser1Timeline.should.equal(res.body);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give zero posts(because demouser3 created and collaborates on zero projects)", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                socialDendroUtils.getTotalPostsForAUsersSocialDendroTimeline(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    parseInt(res.body).should.equal(0);
                    numberOfPostsForDemouser1Timeline.should.not.equal(res.body);
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
