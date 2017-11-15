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

const pageNumber = 1;
let demouser1PostURIsArray;

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
let shareUriOfAManualPost;

describe("Get a specific share information tests", function ()
{
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

    describe("[GET] Get a specific share information /shares/:uri", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
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
                            demouser1PostURIsArray = res.body;// first index is now a manualPost
                            demouser1PostURIsArray.length.should.equal(5);
                            socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[0].uri, shareMock.shareMsg, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                                {
                                    res.statusCode.should.equal(200);
                                    demouser1PostURIsArray = res.body;// first index is now a share of a manualPost
                                    // Force logout
                                    const app = global.tests.app;
                                    agent = chai.request.agent(app);
                                    socialDendroUtils.getShareUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                                    {
                                        res.statusCode.should.equal(401);
                                        res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the Share you want to obtain information belongs to.");
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the share information from a share of a ManualPost in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, publicProjectUri, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;// first index is now a manualPost
                        demouser1PostURIsArray.length.should.equal(5);
                        socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[0].uri, shareMock.shareMsg, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                demouser1PostURIsArray = res.body;// first index is now a share of manualPost
                                shareUriOfAManualPost = demouser1PostURIsArray[0].uri;
                                socialDendroUtils.getShareUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                                {
                                    res.statusCode.should.equal(200);// should be a share of a manual Post
                                    socialDendroUtils.getPostUriPage(true, agent, res.body.ddr.postURI, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/ManualPost");
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the share information from a share of a FileSystemPost in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, folderPathInProject, folderName, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;// first index is now a FileSystemPost
                        demouser1PostURIsArray.length.should.equal(5);
                        socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[0].uri, shareMock.shareMsg, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                demouser1PostURIsArray = res.body;// first index is now a share of FileSystemPost
                                socialDendroUtils.getShareUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                                {
                                    res.statusCode.should.equal(200);// should be a share of FileSystemPost
                                    socialDendroUtils.getPostUriPage(true, agent, res.body.ddr.postURI, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the share information from a share of a MetadataChangePost in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.updateItemMetadata(true, agent, publicProject.handle, folderName, folderMetadata, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;// first index is now a MetadataChangePost
                        demouser1PostURIsArray.length.should.equal(5);
                        socialDendroUtils.shareAPost(true, agent, demouser1PostURIsArray[0].uri, shareMock.shareMsg, function (err, res)
                        {
                            res.statusCode.should.equal(200);
                            socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                            {
                                res.statusCode.should.equal(200);
                                demouser1PostURIsArray = res.body;// first index is now a share of MetadataChangePost
                                socialDendroUtils.getShareUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                                {
                                    res.statusCode.should.equal(200);// should be a share of MetadataChangePost
                                    socialDendroUtils.getPostUriPage(true, agent, res.body.ddr.postURI, function (err, res)
                                    {
                                        res.statusCode.should.equal(200);
                                        expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost");
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give the share information from a share of a ManualPost in a project where demouser2 collaborates)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getShareUriPage(true, agent, shareUriOfAManualPost, function (err, res)
                {
                    res.statusCode.should.equal(200);// should be a share of ManualPost
                    socialDendroUtils.getPostUriPage(true, agent, res.body.ddr.postURI, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/ManualPost");
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error on a share from a project where demouser3 is not a creator or collaborator", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getShareUriPage(true, agent, shareUriOfAManualPost, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the Share you want to obtain information belongs to.");
                    done();
                });
            });
        });

        // the case where the share does not exist
        it("[For demouser1, as the creator of all projects] Should give a not found error from a share that does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getShareUriPage(true, agent, shareUriOfAManualPost + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Page not found");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a not found error from a share that does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getShareUriPage(true, agent, shareUriOfAManualPost + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Page not found");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give a not found error from a share that does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getShareUriPage(true, agent, shareUriOfAManualPost + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Page not found");
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
