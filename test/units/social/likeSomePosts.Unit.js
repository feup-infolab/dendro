process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const socialDendroUtils = rlequire("dendro", "test//utils/social/socialDendroUtils");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
let ShareSomePostsUnit = rlequire("dendro", "test/units/social/shareSomePosts.Unit.js");

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
let useRank = 0;

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
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
                {
                    if (isNull(err))
                    {
                        // para ter acesso nas outras units a seguir
                        // we will like the second post, because position 0 is a share (we called ShareSomePostsUnit before). We want to like the original post and not its share.
                        let postURI = res.body[1].uri;
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
