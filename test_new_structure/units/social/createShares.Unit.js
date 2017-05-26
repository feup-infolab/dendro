process.env.NODE_ENV = 'test';

const Config = GLOBAL.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');

const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Config.absPathInTestsFolder("utils/folder/folderUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));
const postsUtils = require(Config.absPathInTestsFolder("utils/social/post.js"));


const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2"));
const shareMockup = require(Config.absPathInTestsFolder("mockdata/social/share"));



module.exports.setup = function(finish)
{
    let createPostsUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/social/createPosts.Unit.js"));
    let postToBeShared;

    createPostsUnit.setup(function (err, results) {
        if(err)
        {
            finish(err, results);
        }
        else
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                if(!err)
                {
                    postsUtils.getAllPostsFromUserProjects(true, agent, function (err, res) {
                        if(!err)
                        {
                            postToBeShared = res.body[0].uri;
                            postsUtils.shareAPost(true, agent, postToBeShared, shareMockup.msg, function (err, res) {
                                res.sharedPostUri = postToBeShared;
                                finish(err, res);
                            });
                        }
                        else
                        {
                            finish(err, res);
                        }
                    });
                }
                else
                {
                    finish(err, agent);
                }
            });
        }
    });
};