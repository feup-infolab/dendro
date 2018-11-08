const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
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

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");
const shareMock = rlequire("dendro", "test/mockdata/social/shareMock");

const db = rlequire("dendro", "test/utils/db/db.Test.js");
const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");

const pageNumber = 1;
let useRank = 0;
let demouser1PostURIsArray;

describe("Get the shares of a specific post tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Get the shares of a specific post /posts/shares", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(30);
                    demouser1PostURIsArray = res.body;
                    // Force logout
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give a single share by demouser1 for an existing post in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(0);
                    socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[0].uri, shareMock.shareMsg, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.length.should.equal(1);
                            res.body[0].ddr.shareMsg.should.equal(shareMock.shareMsg);
                            userUtils.getUserInfo(demouser1.username, true, agent, function (err, response)
                            {
                                response.statusCode.should.equal(200);
                                res.body[0].ddr.userWhoShared.should.equal(response.body.uri);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser2, as a contributor for all projects] Should give a single share by demouser2 for a post that was shared in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(0);
                    socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[2].uri, shareMock.shareMsg, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.length.should.equal(1);
                            res.body[0].ddr.shareMsg.should.equal(shareMock.shareMsg);
                            userUtils.getUserInfo(demouser2.username, true, agent, function (err, response)
                            {
                                response.statusCode.should.equal(200);
                                res.body[0].ddr.userWhoShared.should.equal(response.body.uri);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        // The case when the post uri is null
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post uri is null", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post uri is null", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post uri is null", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, null, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        // The case when the post does not exist
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostSharesInfo(true, agent, demouser1PostURIsArray[2].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain shares information belongs to.");
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
