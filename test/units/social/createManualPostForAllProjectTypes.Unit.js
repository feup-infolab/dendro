process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

module.exports.setup = function (finish)
{
    let createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
    const projectsData = createProjectsUnit.projectsData;

    let uploadFilesAndAddMetadataUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/uploadFilesAndAddMetadata.Unit.js"));
    let manualPostMockData = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("mockdata/social/manualPostMock.js"));

    uploadFilesAndAddMetadataUnit.setup(function (err, results)
    {
        if (!isNull(err))
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (!isNull(err))
                {
                    finish(err, agent);
                }
                else
                {
                    async.mapSeries(projectsData, function (projectData, cb)
                    {
                        projectUtils.getProjectUriFromHandle(agent, projectData.handle, function (err, res)
                        {
                            if (isNull(err))
                            {
                                let projectUri = res;
                                socialDendroUtils.createManualPostInProject(true, agent, projectUri, manualPostMockData, function (err, res)
                                {
                                    cb(err, res);
                                });
                            }
                            else
                            {
                                cb(err, res);
                            }
                        });
                    }, function (err, results)
                    {
                        finish(err, results);
                    });
                }
            });
        }
    });
};
