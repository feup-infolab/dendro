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

const pageNumber = 1;
let useRank = 0;
let demouser2PostURIsArray;

let folderName = "TestFolderFor_post_uri";
let folderPathInProject = "";
let folderMetadata = [{
    prefix: "dcterms",
    shortName: "abstract",
    value: "This is a test folder and its search tag is pastinha linda. It is a fantastic test of search for specific metadata."
}];
let fileMetadata = [{
    prefix: "dcterms",
    shortName: "abstract",
    value: "This is a test file and its search tag is test file lindo. It is a fantastic test of search for specific metadata."
}];
let publicProjectUri;
let manualPostCreatedByDemouser2;

let notificationsDemouser1;
let notificationsDemouser2;
let notificationsDemouser3;

describe("Get all notifications URIs for a user tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        should.equal(err, null);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            projectUtils.getProjectUriFromHandle(agent, publicProject.handle, function (err, res)
            {
                publicProjectUri = res;
                socialDendroUtils.createManualPostInProject(true, agent, publicProjectUri, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser2PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser2PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o manual post que foi criado
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/ManualPost");
                            manualPostCreatedByDemouser2 = demouser2PostURIsArray[0].uri;
                            done();
                        });
                    });
                });
            });
        });
    });

    describe("[GET] Get all notifications URIs for a user /notifications/all", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            // Force logout
            const app = Config.tests.app;
            agent = chai.request.agent(app);
            socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[For demouser1, as the creator of all projects] Should give x number of notifications URIs for demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser1 = res.body;
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give 0 number of notifications URIs for demouser2(because demouser1 and demouser2 created different posts)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser2 = res.body;
                    notificationsDemouser2.length.should.equal(0);
                    expect(_.intersection(notificationsDemouser2, notificationsDemouser1)).to.be.empty;
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give zero number of notifications URIs for demouser3(because demouser3 is not a collaborator or creator of any projects, therefore also has no posts)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser3 = res.body;
                    notificationsDemouser3.length.should.equal(0);
                    expect(_.intersection(notificationsDemouser3, notificationsDemouser1)).to.be.empty;
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give 1 notifications (on a like made to a post created by demouser2) for demouser2", function (done)
        {
            // Before creating the post demouser2 has zero notifications
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser2 = res.body;
                    notificationsDemouser2.length.should.equal(0);
                    // demouser1 then likes the post created by demouser2
                    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                    {
                        socialDendroUtils.likeAPost(true, agent, manualPostCreatedByDemouser2, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                            {
                                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    notificationsDemouser2 = res.body;
                                    notificationsDemouser2.length.should.equal(1);
                                    // The first notification on the notifications list should be of the like as the list is ordered by the most recent notifications
                                    socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser2[0].uri, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        res.body.ddr.actionType.should.equal("Like");
                                        res.body.ddr.resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give 2 notifications (on a comment and like made to a post created by demouser2) for demouser2", function (done)
        {
            // Before creating the post demouser2 has 1 notification
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser2 = res.body;
                    notificationsDemouser2.length.should.equal(1);
                    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                    {
                        // demouser1 then comments the post created by demouser2
                        socialDendroUtils.commentAPost(true, agent, manualPostCreatedByDemouser2, "This is another comment", function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                            {
                                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    notificationsDemouser2 = res.body;
                                    notificationsDemouser2.length.should.equal(2);
                                    // The first notification on the notifications list should be of the comment as the list is ordered by the most recent notifications
                                    socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser2[0].uri, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        res.body.ddr.actionType.should.equal("Comment");
                                        res.body.ddr.resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give 3 notifications (on a share, a comment and like made to a post created by demouser2) for demouser2", function (done)
        {
            // Before creating the post demouser2 has 2 notification
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    notificationsDemouser2 = res.body;
                    notificationsDemouser2.length.should.equal(2);
                    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                    {
                        // demouser1 then shares the post created by demouser2
                        socialDendroUtils.shareAPost(true, agent, manualPostCreatedByDemouser2, "This is another share message", function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                            {
                                socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    notificationsDemouser2 = res.body;
                                    notificationsDemouser2.length.should.equal(3);
                                    // The first notification on the notifications list should be of the share as the list is ordered by the most recent notifications
                                    socialDendroUtils.getANotificationInfo(true, agent, notificationsDemouser2[0].uri, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        res.body.ddr.actionType.should.equal("Share");
                                        res.body.ddr.resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
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
