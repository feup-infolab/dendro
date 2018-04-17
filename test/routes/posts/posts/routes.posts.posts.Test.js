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

const publicProjectForDemouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project_for_demouser2.js"));

const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js"));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("utils/db/db.Test.js"));
const pageNumber = 1;
let demouser1PostURIsArray;
let invalidPostURIsArray = [];

describe("Get information on an array of posts(given an array of post URIs) tests", function ()
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

    describe("[GET] Gets information on an array of posts (given an array of post URIs) /posts/posts", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.length.should.equal(5);
                    demouser1PostURIsArray = res.body;
                    invalidPostURIsArray = demouser1PostURIsArray.concat();
                    invalidPostURIsArray.push({uri: demouser1PostURIsArray[4].uri + "-errorHere"});
                    invalidPostURIsArray.push({uri: demouser1PostURIsArray[0].uri + "-AnotherErrorHere"});
                    // Force logout
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    // THIS route expects a stringified array
                    socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(demouser1PostURIsArray), function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the posts belong to.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the posts information", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // THIS route expects a stringified array
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(demouser1PostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(200);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[0].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[1].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[2].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[3].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[4].uri);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give the posts information", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                // THIS route expects a stringified array
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(demouser1PostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(200);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[0].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[1].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[2].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[3].uri);
                    JSON.stringify(res.body).should.contain(demouser1PostURIsArray[4].uri);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                // THIS route expects a stringified array
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(demouser1PostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the posts belong to.");
                    done();
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should report an invalid post uri error on posts from the list that do not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // THIS route expects a stringified array
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(invalidPostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(500);
                    res.body.message.should.contain("Error getting a post. Invalid post uri:");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should report an invalid post uri error on posts from the list that do not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(invalidPostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(500);
                    res.body.message.should.contain("Error getting a post. Invalid post uri:");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should report a permission denied error on posts from the list that do not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(invalidPostURIsArray), function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the posts belong to.");
                    done();
                });
            });
        });


        it("[For demouser2, a collaborator in all projects] Should give the posts information for a user even if said user is a collaborator and creator on different dendro projects", function (done)
        {
            //this test was added because of issue https://github.com/feup-infolab/dendro/issues/362
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.createNewProject(true, agent, publicProjectForDemouser2, function (err, res) {
                    res.statusCode.should.equal(200);
                    projectUtils.createFolderInProjectRoot(true, agent, publicProjectForDemouser2.handle, "testFolderForDemouser2Project", function (err, res) {
                        res.statusCode.should.equal(200);
                        socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            res.body.length.should.equal(5);
                            let demouser2PostURIsArray = res.body;
                            socialDendroUtils.getPostsArrayInfo(true, agent, JSON.stringify(demouser2PostURIsArray), function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                JSON.stringify(res.body).should.contain(demouser2PostURIsArray[0].uri);
                                JSON.stringify(res.body).should.contain(demouser2PostURIsArray[1].uri);
                                JSON.stringify(res.body).should.contain(demouser2PostURIsArray[2].uri);
                                JSON.stringify(res.body).should.contain(demouser2PostURIsArray[3].uri);
                                JSON.stringify(res.body).should.contain(demouser2PostURIsArray[4].uri);
                                done();
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
