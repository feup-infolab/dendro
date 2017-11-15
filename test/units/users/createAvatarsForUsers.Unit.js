process.env.NODE_ENV = "test";

const chai = require("chai");
chai.use(require("chai-http"));
const should = chai.should();
const async = require("async");
const colors = require("colors");
let path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder(path.join("models", "meta", "config.js"))).Config;
const isNull = require(Pathfinder.absPathInSrcFolder(path.join("utils", "null.js"))).isNull;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

const start = function ()
{
    console.log("**********************************************".green);
    console.log("[Create Avatars for Users Unit] Setting up Avatars....".green);
    console.log("**********************************************".green);
};

const end = function ()
{
    console.log("**********************************************".blue);
    console.log("[Create Avatars for Users Unit] Complete...".blue);
    console.log("**********************************************".blue);
};

module.exports.setup = function (finish)
{
    start();
    const usersData = [demouser1, demouser2, demouser3];
    let createUsersUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

    createUsersUnit.setup(function (err, results)
    {
        if (isNull(err))
        {
            async.mapSeries(usersData, function (userData, cb)
            {
                userUtils.loginUser(userData.username, userData.password, function (err, agent)
                {
                    if (err)
                    {
                        return cb(err, agent);
                    }
                    userUtils.uploadAvatar(false, agent, userData.avatar, function (err, res)
                    {
                        return cb(err, res);
                    });
                });
            }, function (err, results)
            {
                if (isNull(err))
                {
                    return finish(null);
                }
                end();
                return finish(err, results);
            });
        }
        else
        {
            return finish(err, results);
        }
    });
};
