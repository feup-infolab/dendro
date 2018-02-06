process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const TestUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/testUnit.js")).TestUnit;

class CreateSocialDendroTimelineWithPostsAndShares extends TestUnit
{
    init (finish)
    {
        let commentSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
        commentSomePostsUnit.init(function (err, results)
        {
            callback(err, results);
        });
    }
}

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
