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
const descriptorUtils = rlequire("dendro", "test/utils/descriptor/descriptorUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const metadataOnlyProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");

const folder = rlequire("dendro", "test/mockdata/folders/folder.js");

const addContributorsToProjectsUnit = rlequire("dendro", "test/units/projects/addContributorsToProjects.Unit.js");

describe("My Projects", function (done)
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        should.equal(err, null);
        done();
    });

    describe("[GET] /projects/my", function ()
    {
        it("[HTML] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[HTML] Should not show projects created by demouser1 and where demouser3 does not collaborate when logged in as demouser3", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.not.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.not.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.not.contain("publicprojectcreatedbydemouser1");
                    res.text.should.not.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.not.contain("privateprojectcreatedbydemouser1");
                    res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[HTML] Should give error when the user is not authenticated", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.listAllMyProjects(false, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.text.should.contain("You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[HTML] Should show all the projects where demouser2 collaborates when demouser2 is logged in", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[JSON] Should show all the projects created and where demouser1 collaborates when demouser1 is logged in", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[JSON] Should not show projects created by demouser1 and where demouser3 does not collaborate when logged in as demouser3", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.not.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.not.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.not.contain("publicprojectcreatedbydemouser1");
                    res.text.should.not.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.not.contain("privateprojectcreatedbydemouser1");
                    res.text.should.not.contain("privateprojecthtmlcreatedbydemouser1");
                    done();
                });
            });
        });

        it("[JSON] Should give error when the user is not authenticated", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.listAllMyProjects(true, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[JSON] Should show all the projects where demouser2 collaborates when demouser2 is logged in", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.listAllMyProjects(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("metadataonlyprojectcreatedbydemouser1");
                    res.text.should.contain("metadataonlyhtmlprojectcreatedbydemouser1");

                    res.text.should.contain("publicprojectcreatedbydemouser1");
                    res.text.should.contain("publicprojecthtmlcreatedbydemouser1");

                    res.text.should.contain("privateprojectcreatedbydemouser1");
                    res.text.should.contain("privateprojecthtmlcreatedbydemouser1");
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
