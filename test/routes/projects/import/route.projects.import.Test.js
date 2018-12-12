const chai = require("chai");
const async = require("async");
const chaiHttp = require("chai-http");
const deepEqual = require("deep-equal");
const rlequire = require("rlequire");
const should = chai.should();
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
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

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const uploadFilesAndAddMetadataUnit = rlequire("dendro", "test/units/social/uploadFilesAndAddMetadata.Unit.js");
const createUsersUnit = rlequire("dendro", "test/units/users/createUsers.Unit.js");
const createAllFoldersAndAllFilesInsideThemWithMetadataUnit = rlequire("dendro", "test/units/projects/createAllFoldersAndAllFilesInsideThemWithMetadata.Unit.js");

const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");

const createProjectsUnit = rlequire("dendro", "test/units/projects/createProjects.Unit.js");
const projectsData = createProjectsUnit.projectsData;

describe("Import projects", function (done)
{
    this.timeout(5 * Config.testsTimeout);

    before(function (done)
    {
        createUsersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
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

    describe("[GET] /projects/import", function ()
    {
        it("Should get the html import a project page when logged in as any user", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.importProjectHTMLPage(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("<h1 class=\"page-header\">\n    Import a project\n</h1>");
                    done();
                });
            });
        });

        it("Should get an error when trying to access the html page to import a project when unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProjectHTMLPage(false, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.text.should.contain("You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[JSON] Should give an error if the request for this route is of type JSON", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.importProjectHTMLPage(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("API Request not valid for this route.");
                    done();
                });
            });
        });
    });

    describe("[POST] [Valid Cases] /projects/import", function ()
    {
    // The controller function for the import of projects has changed
    // The dendro webapp now responds to the client right after the project zip is uploaded
    // If there are any errors after the zip upload stage-> they are show on the projects list page
    // The user then has to delete the project or try again
    // This was necessary because some projects being imported were so large that timeouts were occurring
    // So if there are any errors post upload of the zip file -> the project is now not deleted automatically -> the user is shown a status with an error and error message in the projects list page
    // this "before" call bellow is needed because in the previous "describe"
    // In the stub "Should give an error with a status code of 500 when the zip file used to import the project is not in a correct BagIt Format, even though the user is logged in"
    // The import fails but the error given occurs after the project is already created
    // So the project privateproject is leftover with an errored stated
    // This is why this "before" call is needed
        before(function (done)
        {
            createUsersUnit.setup(function (err, results)
            {
                should.equal(err, null);
                done();
            });
        });

        it("Should import all projects correctly when the user is logged in and the zip file used to import the project is not corrupted", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                async.mapSeries(projectsData, function (projectData, callback)
                {
                    projectUtils.importProject(true, agent, projectData, function (err, res)
                    {
                        should.equal(err, null);
                        res.statusCode.should.equal(200);

                        projectUtils.bagit(agent, projectData.handle, function (err, res)
                        {
                            should.equal(err, null);
                            res.statusCode.should.equal(200);

                            async.series([
                                function (callback)
                                {
                                    projectUtils.contentsMatchBackup(projectData, res.body, function (err, result)
                                    {
                                        should.equal(err, null);
                                        should.equal(result, true);
                                        callback(null);
                                    });
                                },
                                function (callback)
                                {
                                    projectUtils.metadataMatchesBackup(projectData, res.body, function (err, result)
                                    {
                                        should.equal(err, null);
                                        should.equal(result, true);
                                        callback(null);
                                    });
                                }
                            ], function (err, results)
                            {
                                callback(err, results);
                            });
                        });
                    });
                }, function (err, results)
                {
                    done(err);
                });
            });
        });
    });

    describe("[POST] [Easy Invalid Cases] /projects/import", function ()
    {
        before(function (done)
        {
            createUsersUnit.setup(function (err, results)
            {
                should.equal(err, null);
                done();
            });
        });

        it("Should give an error when the user is not authenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.importProject(true, agent, privateProject, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("Should give an error with a status code of 400 if no proposed handle was specified for the imported project", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);

                const projectData = JSON.parse(JSON.stringify(privateProject));
                delete projectData.handle;

                projectUtils.importProject(true, agent, projectData, function (err, res)
                {
                    should.not.equal(err, null);
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error with a status code of 400 if the proposed handle specified for the imported project is INVALID", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);

                const projectData = JSON.parse(JSON.stringify(privateProject));
                projectData.handle = "@€@‰@¶@£@€@@€@€@asdasdsadsadsadasd";

                projectUtils.importProject(true, agent, projectData, function (err, res)
                {
                    should.not.equal(err, null);
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("Should give an error with a status code of 500 when the zip file used to import the project is not in a correct BagIt Format, even though the user is logged in", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);

                const projectData = JSON.parse(JSON.stringify(privateProject));
                projectData.backup_path = rlequire.absPathInApp("dendro", "test/mockdata/files/test_uploads/zipTest.zip");

                projectUtils.importProject(true, agent, projectData, function (err, res)
                {
                    should.not.equal(err, null);
                    const result = JSON.parse(res.text);
                    result.result.should.equal("error");
                    result.message.should.contain("Invalid Bagit structure. Are you sure this is a Dendro project backup?");
                    res.statusCode.should.equal(500);
                    done();
                });
            });
        });

    // TODO
    /* it("Should give an error with a status code of 400 when the zip file used to import the project specifies children in a node of the metadata.json file when the node is a file (which cannot have children)", function (done) {
        done(1);
    });

    it("Should give an error with a status code of 400 when the zip file used to import the project specifies unparametrized metadata in the metadata.json file", function (done) {
        done(1);
    });

    it("Should give an error with a status code of 400 when the zip file used to import the project contains a wrong nie:title in the metadata section (title does not match the title of the folder that it refers to", function (done) {
        done(1);
    });

    it("Should give an error with a status code of 400 when the zip file used to import the project contains a wrong nie:title in the metadata section (title does not match the title of the file that it refers to", function (done) {
        done(1);
    }); */
    });

    describe("[POST] [Hard Invalid Cases, requiring a first import] /projects/import", function ()
    {
        // The controller function for the import of projects has changed
        // The dendro webapp now responds to the client right after the project zip is uploaded
        // If there are any errors after the zip upload stage-> they are show on the projects list page
        // The user then has to delete the project or try again
        // This was necessary because some projects being imported were so large that timeouts were occurring
        // So if there are any errors post upload of the zip file -> the project is now not deleted automatically -> the user is shown a status with an error and error message in the projects list page
        // this "before" call bellow is needed because in the previous "describe"
        // In the stub "Should give an error with a status code of 500 when the zip file used to import the project is not in a correct BagIt Format, even though the user is logged in"
        // The import fails but the error given occurs after the project is already created
        // So the project privateproject is leftover with an errored stated
        // This is why this "before" call is needed
        before(function (done)
        {
            createUsersUnit.setup(function (err, results)
            {
                should.equal(err, null);
                done();
            });
        });

        it("Should give an error with a status code of 400 if the proposed handle of the imported project is the same as a currently existing project", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);

                async.mapSeries(projectsData, function (projectData, callback)
                {
                    projectUtils.importProject(true, agent, projectData, function (err, res)
                    {
                        should.equal(err, null);
                        res.statusCode.should.equal(200);

                        // we import a second time every project. Should be refused for every second attempt
                        projectUtils.importProject(true, agent, projectData, function (err, res)
                        {
                            res.statusCode.should.equal(400);
                            const result = JSON.parse(res.text);
                            result.result.should.equal("error");
                            result.message.should.be.instanceof(Array);
                            result.message[0].should.equal("A project with handle " + projectData.handle + " already exists. Please choose another one.");
                            callback(null);
                        });
                    });
                }, function (err, results)
                {
                    done(err);
                });
            });
        });
    });
});
