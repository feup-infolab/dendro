process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

let createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;
class DeleteProjects extends TestUnit
{
    static init (callback)
    {
        createProjectsUnit.init(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                async.mapSeries(projectsData, function (projectData, cb)
                {
                    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                    {
                        if (err)
                        {
                            cb(err, agent);
                        }
                        else
                        {
                            projectUtils.deleteProject(true, agent, projectData.handle, function (err, res)
                            {
                                cb(err, res);
                            });
                        }
                    });
                }, function (err, results)
                {
                    callback(err, results);
                });
            }
        });
    }
}

module.exports = DeleteProjects;
