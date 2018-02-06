process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

class LikeSomePosts extends TestUnit
{
    static init (callback)
    {
        let shareSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/shareSomePosts.Unit.js"));
        shareSomePostsUnit.init(function (err, postURIToLike)
        {
            if (err)
            {
                callback(err, postURIToLike);
            }
            else
            {
                userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                {
                    if (err)
                    {
                        callback(err, agent);
                    }
                    else
                    {
                        socialDendroUtils.likeAPost(true, agent, postURIToLike, function (err, res)
                        {
                            // callback(err, res);
                            callback(err, postURIToLike);
                        });
                    }
                });
            }
        });
    }
}

module.exports = LikeSomePosts;
