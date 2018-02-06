process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let shareSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/shareSomePosts.Unit.js"));
    shareSomePostsUnit.setup(function (err, postURIToLike)
    {
        if (err)
        {
            finish(err, postURIToLike);
        }
        else
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
                }
                else
                {
                    socialDendroUtils.likeAPost(true, agent, postURIToLike, function (err, res)
                    {
                        // finish(err, res);
                        finish(err, postURIToLike);
                    });
                }
            });
        }
    });
};
