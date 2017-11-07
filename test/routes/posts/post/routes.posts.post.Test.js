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

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const createSocialDendroTimelineWithPostsAndSharesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));
let demouser1PostURIsArray;
let pageNumber = 1;

describe('Get a specific post information tests', function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('[GET] Gets a specific post information (given a post URI) /posts/post', function ()
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
                    socialDendroUtils.getAPostInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which this post belongs to.');
                        done();
                    });
                });
            });
        });

        it('[For demouser1, as the creator of all projects] Should give the post information', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    expect(res.body.rdf.type).to.include('http://dendro.fe.up.pt/ontology/0.1/Share');
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give the post information', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    expect(res.body.rdf.type).to.include('http://dendro.fe.up.pt/ontology/0.1/Share');
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which this post belongs to.');
                    done();
                });
            });
        });

        it('[For demouser1, as the creator of all projects] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, 'invalidPostURI', function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which this post belongs to.');
                    done();
                });
            });
        });

        it('[For demouser2, a collaborator in all projects] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, 'invalidPostURI', function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which this post belongs to.');
                    done();
                });
            });
        });

        it('[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getAPostInfo(true, agent, 'invalidPostURI', function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal('Permission denied : You are not a contributor or creator of the project to which this post belongs to.');
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
            done(err);
        });
    });
});
