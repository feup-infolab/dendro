process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const chai = require('chai');
chai.use(require('chai-http'));
const async = require('async');
const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;

const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const folderUtils = require(Pathfinder.absPathInTestsFolder('utils/folder/folderUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('/utils/item/itemUtils'));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder('/utils/social/socialDendroUtils'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2'));
const shareMock = require(Pathfinder.absPathInTestsFolder('mockdata/social/shareMock'));

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

module.exports.setup = function (finish)
{
    let createManualPostForAllProjectTypesUnit = requireUncached(Pathfinder.absPathInTestsFolder('units/social/createManualPostForAllProjectTypes.Unit.js'));
    createManualPostForAllProjectTypesUnit.setup(function (err, results)
    {
        if (err)
        {
            finish(err, results);
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
                    // TODO do the get posts request obtain a uri of a post then share it
                    let pageNumber = 1;
                    socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, function (err, res)
                    {
                        if (isNull(err))
                        {
                            let postURI = res.body[0].uri;// para ter acesso nas outras units a seguir
                            socialDendroUtils.shareAPost(true, agent, postURI, shareMock.shareMsg, function (err, res)
                            {
                                // finish(err, res);
                                finish(err, postURI);
                            });
                        }
                        else
                        {
                            finish(err, res);
                        }
                    });
                }
            });
        }
    });
};
