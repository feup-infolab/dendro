const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const httpUtils = require(Pathfinder.absPathInTestsFolder("utils/http/httpUtils.js"));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder("utils/descriptor/descriptorUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));

const publicProjectHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"));
const metadataOnlyHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"));
const privateProjectHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project_for_html.js"));

const folder = require(Pathfinder.absPathInTestsFolder("mockdata/folders/folder.js"));
const bootup = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));

describe("New project tests", function (done)
{
    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        bootup.setup(function (err, res)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] /projects/new", function ()
    {
        it("[HTML] Should show the new project Html page when logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getNewProjectPage(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<h1 class=\"page-header\">\n    Create a new project\n</h1>");
                    res.text.should.not.contain("<p>Please log into the system.</p>");
                    done();
                });
            });
        });

        it("[HTML] Should not show the new project Html page when unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            projectUtils.getNewProjectPage(false, agent, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.text.should.contain("Please sign in");
                done();
            });
        });

        it("[JSON] Should give an error if the request for this route is of type JSON", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getNewProjectPage(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("API Request not valid for this route.");
                    done();
                });
            });
        });
    });

    // CREATE PROJECTS TESTS
    describe("[POST] with project handle: " + publicProject.handle + " [/projects/new]", function ()
    {
        it("[JSON] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(true, agent, publicProject, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(true, agent, publicProject, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.projects.length.should.equal(1);
                    done();
                });
            });
        });

        it("[HTML] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(false, agent, publicProjectHTMLTests, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(false, agent, publicProjectHTMLTests, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<p>New project This is a public test project with handle publicprojecthtmlcreatedbydemouser1 and created by demouser1 with handle publicprojecthtmlcreatedbydemouser1 created successfully</p>");
                    done();
                });
            });
        });
    });

    describe("[POST] with project handle: " + metadataOnlyProject.handle + " [/projects/new]", function ()
    {
        it("[JSON] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(true, agent, metadataOnlyProject, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(true, agent, metadataOnlyProject, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.projects.length.should.equal(3);
                    done();
                });
            });
        });

        it("[HTML] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(false, agent, metadataOnlyHTMLTests, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(false, agent, metadataOnlyHTMLTests, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<p>New project This is a metadata only test project with handle metadataonlyhtmlprojectcreatedbydemouser1 and created by demouser1 with handle metadataonlyhtmlprojectcreatedbydemouser1 created successfully</p>");
                    done();
                });
            });
        });
    });

    describe("[POST] with project handle: " + privateProject.handle + " [/projects/new]", function ()
    {
        it("[JSON] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(true, agent, privateProject, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Action not permitted. You are not logged into the system.");
                done();
            });
        });

        it("[JSON] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(true, agent, privateProject, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.projects.length.should.equal(5);
                    done();
                });
            });
        });

        it("[HTML] Should show an error when trying to create a project unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.createNewProject(false, agent, privateProjectHTMLTests, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.text.should.contain("<p>Please log into the system.</p>");
                done();
            });
        });

        it("[HTML] Should get a status code of 200 when creating any type of project logged in as demouser1", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.createNewProject(false, agent, privateProjectHTMLTests, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("New project This is a private test project with handle privateprojecthtmlcreatedbydemouser1 and created by demouser1 with handle privateprojecthtmlcreatedbydemouser1 created successfully");
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
