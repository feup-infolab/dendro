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

const publicProjectData = rlequire("dendro", "test/mockdata/projects/public_project.js");
const metadataOnlyProjectData = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const privateProjectData = rlequire("dendro", "test/mockdata/projects/private_project.js");
let manualPostMockData = rlequire("dendro", "test/mockdata/social/manualPostMock.js");
let manualPostMockDataMissingTitle = rlequire("dendro", "test/mockdata/social/manualPostMockMissingTitle.js");
let manualPostMockDataMissingContent = rlequire("dendro", "test/mockdata/social/manualPostMockMissingContent.js");

let publicProjectMachineURI;
let metadataOnlyProjectMachineURI;
let privateProjectMachineURI;

const db = rlequire("dendro", "test/utils/db/db.Test.js");
const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");

describe("Create a new manual post tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] [Public Project] create a new Manual Post /posts/new", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        /* res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which this post belongs to."); */
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        publicProjectMachineURI = projectUri;
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, publicProjectMachineURI, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the title is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, publicProjectMachineURI, manualPostMockDataMissingTitle, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, publicProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, publicProjectMachineURI, manualPostMockDataMissingContent, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    describe("[POST] [Metadata only Project] create a new Manual Post /posts/new", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        /* res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which this post belongs to."); */
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        metadataOnlyProjectMachineURI = projectUri;
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, metadataOnlyProjectMachineURI, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the title is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, metadataOnlyProjectMachineURI, manualPostMockDataMissingTitle, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, metadataOnlyProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, metadataOnlyProjectMachineURI, manualPostMockDataMissingContent, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    describe("[POST] [Private Project] create a new Manual Post /posts/new", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    const app = global.tests.app;
                    agent = chai.request.agent(app);
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(401);
                        /* res.body.message.should.equal("Permission denied : You are not a contributor or creator of the project to which this post belongs to."); */
                        done();
                    });
                });
            });
        });

        it("[For demouser1, as the creator of all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should create the manual post and it should be saved in the database", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                    {
                        res.statusCode.should.equal(200);
                        privateProjectMachineURI = projectUri;
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, privateProjectMachineURI, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post title is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post title is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingTitle, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the title is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, privateProjectMachineURI, manualPostMockDataMissingTitle, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post content is missing
        it("[For demouser1, as the creator of all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give a bad request error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectUriFromHandle(agent, privateProjectData.handle, function (err, projectUri)
                {
                    socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockDataMissingContent, function (err, res)
                    {
                        res.statusCode.should.equal(400);
                        done();
                    });
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post content is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, privateProjectMachineURI, manualPostMockDataMissingContent, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project is missing
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project is missing", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, null, manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        // The case when the post project does not exist
        it("[For demouser1, as the creator of all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should give an unauthorized error if the post project does not exist", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.createManualPostInProject(true, agent, "invalidProjectURI", manualPostMockData, function (err, res)
                {
                    res.statusCode.should.equal(401);
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
