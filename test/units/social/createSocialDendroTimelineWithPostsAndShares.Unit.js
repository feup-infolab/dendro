process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js"));

class CreateSocialDendroTimelineWithPostsAndShares extends TestUnit
{
    load (callback)
    {
        let commentSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
        commentSomePostsUnit.init(function (err, results)
        {
            callback(err, results);
        });
    }
}

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
