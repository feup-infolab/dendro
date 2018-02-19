process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const path = require("path");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
let ShareSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/shareSomePosts.Unit.js"));

class LikeSomePosts extends ShareSomePostsUnit
{
    static init (callback)
    {
        const self = this;
        self.markLoadStart(__filename);
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
                            self.markLoadEnd(path.basename(__filename));

                            callback(err, postURIToLike);
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
}

module.exports = LikeSomePosts;
