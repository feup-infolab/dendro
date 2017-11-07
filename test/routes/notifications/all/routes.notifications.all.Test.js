const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const _ = require('underscore');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');
const async = require('async');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('utils/item/itemUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));
const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const versionUtils = require(Pathfinder.absPathInTestsFolder('utils/versions/versionUtils.js'));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder('utils/descriptor/descriptorUtils.js'));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder('/utils/social/socialDendroUtils'));

const publicProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/public_project.js'));
const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));
const txtMockFile = require(Pathfinder.absPathInTestsFolder('mockdata/files/txtMockFile.js'));
let manualPostMockData = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('mockdata/social/manualPostMock.js'));
const shareMock = require(Pathfinder.absPathInTestsFolder('mockdata/social/shareMock'));

const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

const pageNumber = 1;
let demouser2PostURIsArray;

let folderName = 'TestFolderFor_post_uri';
let folderPathInProject = '';
let folderMetadata = [{
    prefix: 'dcterms',
    shortName: 'abstract',
    value: 'This is a test folder and its search tag is pastinha linda. It is a fantastic test of search for specific metadata.'
}];
let fileMetadata = [{
    prefix: 'dcterms',
    shortName: 'abstract',
    value: 'This is a test file and its search tag is test file lindo. It is a fantastic test of search for specific metadata.'
}];
let publicProjectUri;
let manualPostCreatedByDemouser2;

let notificationsDemouser1;
let notificationsDemouser2;
let notificationsDemouser3;

describe('Get all notifications URIs for a user tests', function ()
{
    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProject.handle, function (err, res)
                {
                    publicProjectUri = res;
                    socialDendroUtils.createManualPostInProject(true, agent, publicProjectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            demouser2PostURIsArray = res.body;
                            res.body.length.should.equal(5);
                            socialDendroUtils.getPostUriPage(true, agent, demouser2PostURIsArray[0].uri, function (err, res)
                            {
                                res.statusCode.should.equal(200);// index 0 tem de ser o manual post que foi criado
                                expect(res.body.rdf.type).to.include('http://dendro.fe.up.pt/ontology/0.1/ManualPost');
                                manualPostCreatedByDemouser2 = demouser2PostURIsArray[0].uri;
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('[GET] Get all notifications URIs for a user /notifications/all', function ()
    {
        it('[For an unauthenticated user] Should give an unauthorized error', function (done)
        {
            // Force logout
            const app = global.tests.app;
            agent = chai.request.agent(app);
            socialDendroUtils.getAllUsersNotifications(true, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal('Action not permitted. You are not logged into the system.');
                done();
            });
        });

        it('[For demouser1, as the creator of all projects] Should give x number of notifications URIs for demouser1', function (done)
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

        it('[For demouser2, a collaborator in all projects] Should give 0 number of notifications URIs for demouser2(because demouser1 and demouser2 created different posts)', function (done)
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

        it('[For demouser3, is not a creator or collaborator in any projects] Should give zero number of notifications URIs for demouser3(because demouser3 is not a collaborator or creator of any projects, therefore also has no posts)', function (done)
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

        it('[For demouser2, a collaborator in all projects] Should give 1 notifications (on a like made to a post created by demouser2) for demouser2', function (done)
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
                                        res.body[0].actionType.should.equal('Like');
                                        res.body[0].resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give 2 notifications (on a comment and like made to a post created by demouser2) for demouser2', function (done)
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
                        socialDendroUtils.commentAPost(true, agent, manualPostCreatedByDemouser2, 'This is another comment', function (err, res)
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
                                        res.body[0].actionType.should.equal('Comment');
                                        res.body[0].resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give 3 notifications (on a share, a comment and like made to a post created by demouser2) for demouser2', function (done)
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
                        socialDendroUtils.shareAPost(true, agent, manualPostCreatedByDemouser2, 'This is another share message', function (err, res)
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
                                        res.body[0].actionType.should.equal('Share');
                                        res.body[0].resourceTargetUri.should.equal(manualPostCreatedByDemouser2);
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
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
