process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");
const should = chai.should();

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

let createProjectsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/projects/createProjects.Unit.js"));
const projectsData = createProjectsUnit.projectsData;

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    createProjectsUnit.setup(function (err, results)
    {
        if (err)
        {
            finish(err, results);
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
                finish(err, results);
            });
        }
    });
};
