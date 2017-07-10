process.env.NODE_ENV = 'test';

const Pathfinder = global.Pathfinder;
const Config = global.Config;

const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const async = require('async');

const projectUtils = require(Pathfinder.absPathInTestsFolder("utils/project/projectUtils.js"));
const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const folderUtils = require(Pathfinder.absPathInTestsFolder("utils/folder/folderUtils.js"));
const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const postsUtils = require(Pathfinder.absPathInTestsFolder("utils/social/post.js"));


const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1"));
const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2"));


module.exports.setup = function(finish)
{
    let createPostsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/social/createPosts.Unit.js"));

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
                            async.mapSeries(res.body, function (post, cb) {
                                postsUtils.likeOrUnlikeAPost(true, agent, post.uri, function (err, res) {
                                    cb(err, res);
                                });
                            }, function (err, results) {
                                finish(err, results);
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