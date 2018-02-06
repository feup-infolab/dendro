process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const commentMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/commentMock"));

module.exports.setup = function (finish)
{
    let likeSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/likeSomePosts.Unit.js"));
    likeSomePostsUnit.setup(function (err, postURIToShare)
    {
        if (err)
        {
            finish(err, postURIToShare);
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
                    socialDendroUtils.commentAPost(true, agent, postURIToShare, commentMock.commentMsg, function (err, res)
                    {
                        finish(err, res);
                    });
                }
            });
        }
    });
};
