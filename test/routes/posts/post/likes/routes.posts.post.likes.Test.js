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
const socialDendroUtils = rlequire("dendro", "test//utils/social/socialDendroUtils");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

const pageNumber = 1;
let useRank = 0;
let demouser1PostURIsArray;

describe("Gives the like information of a post tests", function ()
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

    describe("[GET] Gives the like information of a Post /posts/post/likes", function ()
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
                    socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should respond with the information that only demouser liked the post in question to an existing post in a project created by demouser1 and liked by demouser1 only", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    // post does not yet have any likes
                    res.body.postURI.should.equal(demouser1PostURIsArray[0].uri);
                    res.body.numLikes.should.equal(0);
                    res.body.usersWhoLiked.length.should.equal(0);
                    socialDendroUtils.likeAPost(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.postURI.should.equal(demouser1PostURIsArray[0].uri);
                            res.body.numLikes.should.equal(1);
                            userUtils.getUserInfo(demouser1.username, true, agent, function (err, response)
                            {
                                response.statusCode.should.equal(200);
                                res.body.usersWhoLiked.length.should.equal(1);
                                res.body.usersWhoLiked.should.include(response.body.uri);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should respond with information that no user liked the post in question to an existing post in a project where demouser2 collaborates but where zero likes were made", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[2].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.postURI.should.equal(demouser1PostURIsArray[2].uri);
                    res.body.numLikes.should.equal(0);
                    res.body.usersWhoLiked.length.should.equal(0);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to.");
                    done();
                });
            });
        });

        // The case when the post does not exist
        it("[For demouser1, as the creator of all projects] Should give a not found error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a not found error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to.");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostLikesInfo(true, agent, demouser1PostURIsArray[0].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain likes information belongs to.");
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
