process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const socialDendroUtils = require(Pathfinder.absPathInTestsFolder("/utils/social/socialDendroUtils"));

const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));
const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3"));

module.exports.setup = function (finish)
{
    userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
    {
        if (err)
        {
            finish(err, agent);
        }
        else
        {
            socialDendroUtils.getPostsURIsForUser(true, agent, 1, 0, function (err, res)
            {
                if (err)
                {
                    finish(err, res);
                }
                else
                {
                    socialDendroUtils.getPostsURIsForUser(true, agent, 1, 1, function (err, res)
                    {
                        if (err)
                        {
                            finish(err, res);
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
                                    socialDendroUtils.getPostsURIsForUser(true, agent, 1, 0, function (err, res)
                                    {
                                        if (err)
                                        {
                                            finish(err, res);
                                        }
                                        else
                                        {
                                            socialDendroUtils.getPostsURIsForUser(true, agent, 1, 1, function (err, res)
                                            {
                                                if (err)
                                                {
                                                    finish(err, res);
                                                }
                                                else
                                                {
                                                    userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
                                                    {
                                                        if (err)
                                                        {
                                                            finish(err, agent);
                                                        }
                                                        else
                                                        {
                                                            socialDendroUtils.getPostsURIsForUser(true, agent, 1, 0, function (err, res)
                                                            {
                                                                if (err)
                                                                {
                                                                    finish(err, res);
                                                                }
                                                                else
                                                                {
                                                                    socialDendroUtils.getPostsURIsForUser(true, agent, 1, 1, function (err, res)
                                                                    {
                                                                        finish(err, res);
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};
