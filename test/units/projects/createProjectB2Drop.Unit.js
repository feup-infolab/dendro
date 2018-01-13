process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));

const b2dropProjectData = require(Pathfinder.absPathInTestsFolder("mockdata/projects/b2drop_project.js"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".green);
        console.log("[Create B2Drop Project Unit] Setting up projects...".green);
        console.log("**********************************************".green);
    }
};

const end = function ()
{
    if (Config.debug.tests.log_unit_completion_and_startup)
    {
        console.log("**********************************************".blue);
        console.log("[Create B2Drop Project Unit] Complete...".blue);
        console.log("**********************************************".blue);
    }
};

module.exports.setup = function (finish)
{
    start();
    let createUsersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

    createUsersUnit.setup(function (err, results)
    {
        // should.equal(err, null);
        if (err)
        {
            end();
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                if (err)
                {
                    end();
                    finish(err, agent);
                }
                else
                {
                    projectUtils.createNewProject(true, agent, b2dropProjectData, function (err, res)
                    {
                        end();
                        finish(err, res);
                    });
                }
            });
        }
    });
};

