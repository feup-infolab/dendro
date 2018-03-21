process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const chai = require("chai");
chai.use(require("chai-http"));
const should = chai.should();
const async = require("async");
const path = require("path");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

const publicProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project.js"));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project.js"));
const privateProject = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project.js"));
const projectCreatedByDemoUser3 = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project_created_by_demouser3.js"));

const publicProjectForHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/public_project_for_html.js"));
const metadataOnlyProjectForHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/metadata_only_project_for_html.js"));
const privateProjectForHTMLTests = require(Pathfinder.absPathInTestsFolder("mockdata/projects/private_project_for_html.js"));

const projectsData = [publicProject, metadataOnlyProject, privateProject, publicProjectForHTMLTests, metadataOnlyProjectForHTMLTests, privateProjectForHTMLTests];

let CreateUsersUnit = require(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

class CreateProjects extends CreateUsersUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        async.series([
            function (cb1)
            {
                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    if (isNull(err))
                    {
                        async.mapSeries(projectsData, function (projectData, cb2)
                        {
                            if (err)
                            {
                                cb2(err, agent);
                            }
                            else
                            {
                                projectUtils.createNewProject(true, agent, projectData, function (err, res)
                                {
                                    cb2(err, res);
                                });
                            }
                        },
                        function (err, result)
                        {
                            cb1(err, result);
                        });
                    }
                    else
                    {
                        throw new Error(err);
                    }
                });
            },
            function (cb1)
            {
                userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
                {
                    if (err)
                    {
                        cb1(err, agent);
                    }
                    else
                    {
                        projectUtils.createNewProject(true, agent, projectCreatedByDemoUser3, function (err, res)
                        {
                            cb1(err, res);
                        });
                    }
                });
            }

        ], function (err, results)
        {
            if (isNull(err))
            {
                unitUtils.endLoad(self, function (err, results)
                {
                    callback(err, results);
                });
            }
            else
            {
                callback(err, results);
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
    static shutdown (callback)
    {
        super.shutdown(callback);
    }

    static setup (callback)
    {
        super.setup(callback);
    }
}

CreateProjects.projectsData = projectsData;

module.exports = CreateProjects;
