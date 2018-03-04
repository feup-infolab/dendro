process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const chai = require("chai");
chai.use(require("chai-http"));
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const path = require("path");

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const shareMock = require(Pathfinder.absPathInTestsFolder("mockdata/social/shareMock"));

let CreateManualPostForAllProjectTypesUnit = require(Pathfinder.absPathInTestsFolder("units/social/createManualPostForAllProjectTypes.Unit.js"));
class ShareSomePosts extends CreateManualPostForAllProjectTypesUnit
{
    static load (callback)
    {
        const self = this;
        self.startLoad(__filename);
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
                {
                    if (err)
                    {
                        callback(err, agent);
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
                                    self.endLoad(__filename, callback);
                                });
                            }
                            else
                            {
                                callback(err, res);
                            }
                        });
                    }
                });
            }
        });
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

module.exports = ShareSomePosts;
