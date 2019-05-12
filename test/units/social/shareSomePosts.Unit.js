process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const socialDendroUtils = rlequire("dendro", "test/utils/social/socialDendroUtils");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2");
const shareMock = rlequire("dendro", "test/mockdata/social/shareMock");
let useRank = 0;

let CreateManualPostForAllProjectTypesUnit = rlequire("dendro", "test/units/social/createManualPostForAllProjectTypes.Unit.js");
class ShareSomePosts extends CreateManualPostForAllProjectTypesUnit
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

                        // we will share the first post, hence the position 0
                        let postURI = res.body[0].uri;

                        socialDendroUtils.shareAPost(true, agent, postURI, shareMock.shareMsg, function (err, res)
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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}


module.exports = ShareSomePosts;
