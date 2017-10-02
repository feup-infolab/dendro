const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const expect = chai.expect;
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

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));
const txtMockFile = require(Pathfinder.absPathInTestsFolder("mockdata/files/txtMockFile.js"));
let manualPostMockData = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("mockdata/social/manualPostMock.js"));
const shareMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/shareMock"));

const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));

let notificationsDemouser1;

describe("Get a specific notification information tests", function () {
    before(function (done) {
        this.timeout(Config.testsTimeout);
        //creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Get a specific notification information /notifications/notification", function () {

        it("[For an unauthenticated user] Should give an unauthorized error", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res) {
                    res.statusCode.should.equal(200);
                    notificationsDemouser1 = res.body;
                    notificationsDemouser1.length.should.equal(3);
                    //Force logout
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res) {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the notification information about a post created by demouser1 or demouser1 activities", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body[0].actionType.should.equal("Comment");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error for the notification information about a post created by demouser1 or demouser1 activities", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error for the notification information about a post created by demouser1 or demouser1 activities", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        //the case where the notification does not exist
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error for a notification that does not exist", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error for a notification that does not exist", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error for a notification that does not exist", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        //the case where the notificationUri is null
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error for a notification uri that is null", function (done) {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error for a notification uri that is null", function (done) {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error for a notification uri that is null", function (done) {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res) {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
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