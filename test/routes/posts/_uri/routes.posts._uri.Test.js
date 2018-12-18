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

const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

const pageNumber = 1;
let useRank = 0;
let demouser1PostURIsArray;

let folderName = "TestFolderFor_post_uri";
let folderPathInProject = "";
let folderMetadata = [{prefix: "dcterms", shortName: "abstract", value: "This is a test folder and its search tag is pastinha linda. It is a fantastic test of search for specific metadata."}];
let fileMetadata = [{prefix: "dcterms", shortName: "abstract", value: "This is a test file and its search tag is test file lindo. It is a fantastic test of search for specific metadata."}];
let fileUri;
let publicProjectUri;

describe("Get a specific post information tests", function ()
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

    describe("[GET] Get a specific post information /posts/:uri", function ()
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
                    socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the Share you want to obtain information belongs to.");
                        // res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a  ManualPost in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
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
                            demouser1PostURIsArray = res.body;
                            res.body.length.should.equal(30);
                            socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                            {
                                res.statusCode.should.equal(200);// index 0 tem de ser o manual post que foi criado
                                expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/ManualPost");
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a FileSystemPost created by a mkdir operation in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.createFolder(true, agent, publicProject.handle, folderPathInProject, folderName, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post da criação da pasta
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                            res.body.dcterms.title.should.equal(demouser1.username + " created folder " + folderName);
                            done();
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a FileSystemPost created by an upload of a file in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                fileUtils.uploadFile(true, agent, publicProject.handle, folderName, txtMockFile, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    fileUri = res.body[0].uri;
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post do upload do file
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                            res.body.dcterms.title.should.equal(demouser1.username + " uploaded file " + txtMockFile.name);
                            done();
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a MetadataChange post created by metadata work on a folder in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.updateItemMetadata(true, agent, publicProject.handle, folderName, folderMetadata, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post com a added metadata à folder
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost");
                            res.body.dcterms.title.should.equal(demouser1.username + " worked on 1 metadata changes");
                            res.body.changesInfo.addChanges[0].ddr.newValue.should.equal(folderMetadata[0].value);
                            done();
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a MetadataChange post created by metadata work on a file in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.updateItemMetadataByUri(true, agent, fileUri, fileMetadata, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post com a added metadata ao file
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost");
                            res.body.dcterms.title.should.equal(demouser1.username + " worked on 1 metadata changes");
                            res.body.changesInfo.addChanges[0].ddr.newValue.should.equal(fileMetadata[0].value);
                            done();
                        });
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a FileSystemPost created by a delete file operation in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItemByUri(true, agent, fileUri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted " + fileUri);
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post com o deletedFile
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                            res.body.dcterms.title.should.equal(demouser1.username + " deleted file " + txtMockFile.name);
                            done();
                        });
                    });
                }, false);
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a FileSystemPost created by a rmdir operation in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, publicProject.handle, folderName, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            res.statusCode.should.equal(200);// index 0 tem de ser o post com o deleted folder
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                            res.body.dcterms.title.should.equal(demouser1.username + " deleted folder " + folderName);
                            res.body.ddr.deleted.should.equal(false);
                            done();
                        });
                    });
                }, false);
            });
        });

        it("[For demouser1, as the creator of all projects] Should give the post information from a FileSystemPost created by a really delete rmdir operation in a project created by demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, publicProject.handle, folderName, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.message.should.contain("Successfully deleted");
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        demouser1PostURIsArray = res.body;
                        res.body.length.should.equal(30);
                        socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[0].uri, function (err, res)
                        {
                            // index 0 tem de ser o post com o really deleted folder
                            res.statusCode.should.equal(200);
                            expect(res.body.rdf.type).to.include("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost");
                            res.body.dcterms.title.should.equal(demouser1.username + " deleted folder " + folderName);
                            res.body.ddr.deleted.should.equal(true);
                            done();
                        });
                    });
                }, true);
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give the post information from a post in a project where demouser2 collaborates)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[1].uri, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.uri.should.equal(demouser1PostURIsArray[1].uri);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error on a post from a project where demouser3 is not a creator or collaborator", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[1].uri, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which the post you want to obtain information belongs to.");
                    done();
                });
            });
        });

        // the case where the post does not exist
        it("[For demouser1, as the creator of all projects] Should give a Page not found error from a post that does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[1].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Page not found");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a Page not found error from a post that does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[1].uri + "-bugHere", function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.message.should.equal("Page not found");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give a Page not found error from a post that does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getPostUriPage(true, agent, demouser1PostURIsArray[1].uri + "-bugHere", function (err, res)
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

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
