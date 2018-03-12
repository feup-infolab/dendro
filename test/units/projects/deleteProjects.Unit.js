process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const path = require("path");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

let CreateProjectsUnit = require(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = CreateProjectsUnit.projectsData;

class DeleteProjects extends CreateProjectsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
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
                            projectUtils.deleteProject(true, agent, projectData.handle, function (err, res)
                            {
                                cb(err, res);
                            });
                        }
                    });
                }, function (err, results)
                {
                    unitUtils.endLoad(self, callback);
                });
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
}

module.exports = DeleteProjects;
