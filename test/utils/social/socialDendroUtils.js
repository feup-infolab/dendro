const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);


//true, agent, projectData, manualPostMockData, cb
module.exports.createManualPostInProject = function (jsonOnly, agent, projectURI, manualPostData, cb) {
    /*req.body.newPostContent req.body.newPostTitle req.body.newPostProjectUri*/
    const path = "/posts/new";
    if (jsonOnly) {
        agent
            .post(path)
            .send({newPostContent: manualPostData.newPostContent, newPostTitle: manualPostData.newPostTitle, newPostProjectUri: projectURI})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .send({newPostContent: manualPostData.newPostContent, newPostTitle: manualPostData.newPostTitle, newPostProjectUri: projectURI})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getPostsURIsForUser = function (jsonOnly, agent, pageNumber, cb) {
    const path = "/posts/all";
    if (jsonOnly) {
        agent
            .get(path)
            .query({currentPage: pageNumber})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({currentPage: pageNumber})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.shareAPost = function (jsonOnly, agent, postUriToshare, shareMsg, cb) {
    const path = "/posts/share";
    if (jsonOnly) {
        agent
            .post(path)
            .send({shareMsg: shareMsg, postID: postUriToshare})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .send({shareMsg: shareMsg, postID: postUriToshare})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports.likeAPost = function(jsonOnly, agent, postURIToLike, cb)
{
    const path = "/posts/like";
    if (jsonOnly) {
        agent
            .post(path)
            .send({postID: postURIToLike})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .send({postID: postURIToLike})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports.commentAPost = function (jsonOnly, agent, postURIToComment, commentMsg, cb) {
    const path = "/posts/comment";
    if (jsonOnly) {
        agent
            .post(path)
            .send({commentMsg: commentMsg, postID: postURIToComment})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .send({commentMsg: commentMsg, postID: postURIToComment})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

