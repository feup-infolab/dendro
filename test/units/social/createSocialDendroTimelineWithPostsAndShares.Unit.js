process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let commentSomePostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/commentSomePosts.Unit.js"));
    commentSomePostsUnit.setup(function (err, results)
    {
        finish(err, results);
    });
};
