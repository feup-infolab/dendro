process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const commentMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/commentMock"));

let LikeSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/likeSomePosts.Unit.js"));
class CommentSomePosts extends LikeSomePostsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            if (err)
            {
                callback(err, agent);
            }
            else
            {
                // TODO do the get posts request obtain a uri of a post then share it
                let pageNumber = 1;
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                {
                    if (isNull(err))
                    {
                        // we will like the second post, because position 0 is a share (we called ShareSomePostsUnit before). We want to comment the original post and not its share.
                        let postURI = res.body[1].uri;
                        socialDendroUtils.commentAPost(true, agent, postURI, commentMock.commentMsg, function (err, res)
                        {
                            if (!err)
                            {
                                unitUtils.endLoad(self, function (err)
                                {
                                    callback(err, res);
                                });
                            }
                            else
                            {
                                callback(err, res);
                            }
                        });
                    }
                    else
                    {
                        callback(err, res);
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

module.exports = CommentSomePosts;
