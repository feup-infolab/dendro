process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
const path = require("path");
chai.use(require("chai-http"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));

let CommentSomePostsUnit = require(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
class CreateSocialDendroTimelineWithPostsAndShares extends CommentSomePostsUnit
{
    static load (callback)
    {
        const self = this;
        self.markLoadStart(__filename);
        super.load(function (err, results)
        {
            self.markLoadEnd(path.basename(__filename));

            callback(err, results);
        });
    }
    static init (callback)
    {
        super.init(callback);
    }
}

module.exports = CreateSocialDendroTimelineWithPostsAndShares;
