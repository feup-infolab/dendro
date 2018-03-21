process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

let CommentSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
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
