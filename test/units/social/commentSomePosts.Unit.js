process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const socialDendroUtils = rlequire("dendro", "test/utils/social/socialDendroUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
const commentMock = rlequire("dendro", "test/mockdata/social/commentMock");

let LikeSomePostsUnit = rlequire("dendro", "test/units/social/likeSomePosts.Unit.js");
let useRank = 0;

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
                socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}


module.exports = CommentSomePosts;
