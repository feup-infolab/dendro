process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const async = require("async");

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const itemUtils = require(Pathfinder.absPathInTestsFolder("/utils/item/itemUtils"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let shareSomePostsUnit = requireUncached(Pathfinder.absPathInTestsFolder("units/social/shareSomePosts.Unit.js"));
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
