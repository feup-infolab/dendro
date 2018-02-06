process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const commentMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/commentMock"));

const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;
class CommentSomePosts extends TestUnit
{
    static init (callback)
    {
        let likeSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/likeSomePosts.Unit.js"));
        likeSomePostsUnit.init(function (err, postURIToShare)
        {
            if (err)
            {
                callback(err, postURIToShare);
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
                        socialDendroUtils.commentAPost(true, agent, postURIToShare, commentMock.commentMsg, function (err, res)
                        {
                            callback(err, res);
                        });
                    }
                });
            }
        });
    }
}

module.exports = CommentSomePosts;
