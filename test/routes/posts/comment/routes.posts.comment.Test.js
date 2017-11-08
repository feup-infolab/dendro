const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
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

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));
const commentMock = require(Pathfinder.absPathInTestsFolder('mockdata/social/commentMock'));

const socialDendroUtils = require(Pathfinder.absPathInTestsFolder('/utils/social/socialDendroUtils'));

const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));
const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js'));

const pageNumber = 1;
let demouser1PostURIsArray;

describe('Comment a specific post tests', function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('[POST] Comment a specific post /posts/comment', function ()
    {
        it('[For an unauthenticated user] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(5);
                    demouser1PostURIsArray = res.body;
                    // Force logout
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, commentMock.commentMsg, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                        done();
                    });
                });
            });
        });

        it('[For demouser1, as the creator of all projects] Should respond with success to an existing post in a project created by demouser1', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.equal('Post commented successfully');
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should respond with success to an existing post in a project where demouser2 collaborates', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.equal('Post commented successfully');
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        // The case when the post does not exist
        it('[For demouser1, as the creator of all projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri + '-bugHere', commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri + '-bugHere', commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri + '-bugHere', commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        // The case when the comment message is empty
        it('[For demouser1, as the creator of all projects] Should respond with a bad request error to an existing post in a project created by demouser1 and where the comment message is empty', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, null, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("Missing required body parameter 'commentMsg'");
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should respond with a bad request error to an existing post in a project where demouser2 collaborates and where the comment message is empty', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, null, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("Missing required body parameter 'commentMsg'");
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the comment message is empty', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, demouser1PostURIsArray[0].uri, null, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        // The case when the post uri is null
        it('[For demouser1, as the creator of all projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, null, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, null, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post does not exist', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.commentAPost(true, agent, null, commentMock.commentMsg, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which the post you want to comment belongs to.');
                    done();
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
