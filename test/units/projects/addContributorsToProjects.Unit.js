process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const CreateProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));

const projectsData = CreateProjectsUnit.projectsData;

class AddContributorsToProjects extends CreateProjectsUnit
{
    static load (callback)
    {
        super.load(function (err, results)
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
                            userUtils.addUserAscontributorToProject(true, agent, demouser2.username, projectData.handle, function (err, res)
                            {
                                cb(err, res);
                            });
                        }
                    });
                }, function (err, results)
                {
                    callback(err, results);
                    unitUtils.end(__filename);
                });
            }
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = AddContributorsToProjects;
