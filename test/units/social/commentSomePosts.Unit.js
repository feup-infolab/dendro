process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const chai = require('chai');
chai.use(require('chai-http'));
const async = require('async');

const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const folderUtils = require(Pathfinder.absPathInTestsFolder('utils/folder/folderUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('/utils/item/itemUtils'));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder('/utils/social/socialDendroUtils'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2'));
const commentMock = require(Pathfinder.absPathInTestsFolder('mockdata/social/commentMock'));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let likeSomePostsUnit = requireUncached(Pathfinder.absPathInTestsFolder('units/social/likeSomePosts.Unit.js'));
    likeSomePostsUnit.setup(function (err, postURIToShare)
    {
        if (err)
        {
            finish(err, postURIToShare);
        }
        else
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                if (err)
                {
                    finish(err, agent);
                }
                else
                {
                    socialDendroUtils.commentAPost(true, agent, postURIToShare, commentMock.commentMsg, function (err, res)
                    {
                        finish(err, res);
                    });
                }
            });
        }
    });
};
