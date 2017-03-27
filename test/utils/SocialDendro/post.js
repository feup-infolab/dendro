var chai = require('chai');
var chaiHttp = require('chai-http');
var _ = require('underscore');
chai.use(chaiHttp);

var getAllPostsFromUserProjects = function (jsonOnly, agent, cb) {
    // /posts/all
    var path = '/posts/all';
    if(jsonOnly)
    {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getAPostInfo = function (jsonOnly, agent, postID, cb) {
    // /posts/post
    var path = '/posts/post';
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID : postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID : postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var likeOrUnlikeAPost = function (jsonOnly, agent, postID, cb) {
    // /posts/like
    var path = '/posts/like';
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID : postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID : postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports = {
    getAllPostsFromUserProjects: getAllPostsFromUserProjects,
    getAPostInfo: getAPostInfo,
    likeOrUnlikeAPost: likeOrUnlikeAPost
};
