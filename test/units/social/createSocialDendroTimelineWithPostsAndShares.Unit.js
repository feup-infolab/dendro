process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));

class CreateSocialDendroTimelineWithPostsAndShares extends TestUnit
{
    static load (callback)
    {
        let commentSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
        commentSomePostsUnit.init(function (err, results)
        {
            callback(err, results);
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
