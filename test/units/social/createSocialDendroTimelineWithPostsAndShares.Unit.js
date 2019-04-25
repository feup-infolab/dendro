process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));

const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
let CommentSomePostsUnit = rlequire("dendro", "test/units/social/commentSomePosts.Unit.js");
let createTimelineInMySQL = rlequire("dendro", "test/units/social/createTimelineInMySQL.Unit.js");

class CreateSocialDendroTimelineWithPostsAndShares extends CommentSomePostsUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        unitUtils.endLoad(self, callback);

        // createTimelineInMySQL.setup(function (err, results)
        // {
        //     if (err)
        //     {
        //         callback(err, results);
        //     }
        //     else
        //     {
        //         unitUtils.endLoad(self, callback);
        //     }
        // });
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

(async () => {await require("@feup-infolab/docker-mocha").runSetup(CreateSocialDendroTimelineWithPostsAndShares);})();

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
