process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

let CommentSomePostsUnit = rlequire("dendro", "test/units/social/commentSomePosts.Unit.js");
class CreateSocialDendroTimelineWithPostsAndShares extends CommentSomePostsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        unitUtils.endLoad(self, callback);
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

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
