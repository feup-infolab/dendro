const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const folderUtils = rlequire("dendro", "test/utils/folder/folderUtils.js");
const httpUtils = rlequire("dendro", "test/utils/http/httpUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const metadataProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");
const folderForDemouser2 = rlequire("dendro", "test/mockdata/folders/folderDemoUser2.js");
const addContributorsToProjectsUnit = rlequire("dendro", "test/units/projects/addContributorsToProjects.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Metadata Project mkdir", function (done)
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        addContributorsToProjectsUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[POST] /project/:handle?mkdir " + metadataProject.handle, function ()
    {
        it("Should give an error if an invalid project is specified", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(true, agent, "invalidProjectHandle", folder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it("Should give an error if the request for this route is of type HTML", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(false, agent, metadataProject.handle, folder.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.text.should.equal("HTML Request not valid for this route.");
                    done();
                });
            });
        });

        it("Should give an error when the user is unauthenticated", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createFolderInProjectRoot(true, agent, metadataProject.handle, folder.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error when the user is logged in as demouser3(not a collaborator nor creator in a project by demouser1)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(true, agent, metadataProject.handle, folder.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("Should create the folder with success if the user is logged in as demouser1(the creator of the project)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(true, agent, metadataProject.handle, folder.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.result.should.equal("ok");
                    res.body.new_folder.nie.title.should.equal(folder.name);
                    res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                    done();
                });
            });
        });

        it("Should create the folder with success if the user is logged in as demouser2(a collaborator of the project)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(true, agent, metadataProject.handle, folderForDemouser2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.result.should.equal("ok");
                    res.body.new_folder.nie.title.should.equal(folderForDemouser2.name);
                    res.body.new_folder.nie.isLogicalPartOf.should.match(appUtils.resource_id_uuid_regex("folder"));
                    done();
                });
            });
        });

        it("Should give an error if an invalid name is specified for the folder, even if the user is logged in as a creator or collaborator on the project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createFolderInProjectRoot(true, agent, metadataProject.handle, "thisIsAn*InvalidFolderName", function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("invalid file name specified");
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
            done(err);
        });
    });
});
