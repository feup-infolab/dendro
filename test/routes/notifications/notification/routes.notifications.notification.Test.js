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

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const fileUtils = rlequire("dendro", "test/utils/file/fileUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const versionUtils = rlequire("dendro", "test/utils/versions/versionUtils.js");
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");
const socialDendroUtils = rlequire("dendro", "test/utils/social/socialDendroUtils");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");
const txtMockFile = rlequire("dendro", "test/mockdata/files/txtMockFile.js");
let manualPostMockData = rlequire("dendro", "test/mockdata/social/manualPostMock.js");
const shareMock = rlequire("dendro", "test/mockdata/social/shareMock");

const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

let notificationsDemouser1;

describe("Get a specific notification information tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Get a specific notification information /notifications/notification", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser1 = res.body;
                    notificationsDemouser1.length.should.equal(3);
                    // Force logout
                    const app = Config.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the notification information about a post created by demouser1 or demouser1 activities", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.ddr.actionType.should.equal("Comment");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error for the notification information about a post created by demouser1 or demouser1 activities", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error for the notification information about a post created by demouser1 or demouser1 activities", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not the author of the resource that this notification points to.");
                    done();
                });
            });
        });

        // the case where the notification does not exist
        it("[For demouser1, as the creator of all projects] Should give a not found error for a notification that does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a not found error for a notification that does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give a not found error for a notification that does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser1[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });

        // the case where the notificationUri is null
        it("[For demouser1, as the creator of all projects] Should give a not found error for a notification uri that is null", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a not found error for a notification uri that is null", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give a not found error for a notification uri that is null", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getANotificationInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Invalid notification uri");
                    done();
                });
            });
        });
    });

    after(function (done)
    {
        // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
