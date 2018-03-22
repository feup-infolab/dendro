process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
let ShareSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/shareSomePosts.Unit.js"));

const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

class LikeSomePosts extends ShareSomePostsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        super.init(function (err, postURIToLike)
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
                            unitUtils.endLoad(self, callback);
                        });
                    }
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

module.exports = LikeSomePosts;
