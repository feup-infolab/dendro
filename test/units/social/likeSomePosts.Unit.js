process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
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
                        // para ter acesso nas outras units a seguir
                        let postURI = res.body[0].uri;
                        socialDendroUtils.likeAPost(true, agent, postURI, function (err, res)
                        {
                            unitUtils.endLoad(self, function (err)
                            {
                                callback(err, res);
                            });
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

module.exports = LikeSomePosts;
