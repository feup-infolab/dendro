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
const projectUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const addContributorsToProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/addContributorsToProjects.Unit.js"));

let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

describe("Project storageConfig tests", function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        projectUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("Create Project with storage Config", function ()
    {
        it("Should create a project public project with default storage config", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, publicProject.handle, function (err, res)
                {
                    should.not.exist(err);

                    var descriptors = res.body.descriptors;
                    var found = false;
                    for (var i = 0; i < descriptors.length; i++)
                    {
                        if (descriptors[i].shortName === "hasStorageConfig")
                        {
                            done();
                            found = true;
                            break;
                        }
                    }

                    if (!found)
                    {
                        done("hasActiveStorageConfig not set");
                    }
                });
            });
        });

        it("Should edit storage config has  project owner", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.not.exist(err);
                projectUtils.getProjectMetadata(true, agent, publicProject.handle, function (err, res)
                {
                    should.not.exist(err);
                    // Check config inicial  == OK
                    projectUtils.projectStorage(false, agent, publicProject.handle, function (err, res)
                    {
                        should.not.exist(err);
                        // Check config enviada == OK

                        projectUtils.projectStorage(true, agent, publicProject.handle, function (err, res)
                        {
                            should.not.exist(err);
                            // check config == to created
                            done();
                        });
                    });
                });
            });
        });

        it("Should try to edit storage config and doesnt have permissions", function (done)
        {
            // usar user que nao seja owner / contribuidor do projecto
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, publicProject.handle, function (err, res)
                {
                    should.not.exist(err);
                    projectUtils.edit_project_storage(function (err, res)
                    {
                        should.exist(err);

                        // verificar metadados do proj == metadaddos inicial

                        done();
                    });
                });
            });
        });

        it("Should  create a new storage config and initiate the new storage", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // Get initial project storage config
                // Export project to no storage
                // Check storage config  == new
                // Check project exported correctly
                // should give OK status
                done();
            });
        });

        it("Should edit storage config and fail to initiate the new storage", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                // Get initial project storage config
                // Export project to no storage Should fail
                // Check storage config  == old
                // Check project should remain equal
                // should give !OK status
                done();
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
