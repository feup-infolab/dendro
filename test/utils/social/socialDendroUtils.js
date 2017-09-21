const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);


//true, agent, projectData, manualPostMockData, cb
module.exports.createManualPostInProject = function (jsonOnly, agent, projectData, manualPostData, cb) {
    /*req.body.newPostContent req.body.newPostTitle req.body.newPostProjectUri*/
    const path = "/posts/new";
    if (jsonOnly) {
        agent
            .post(path)
            .send({newPostContent: manualPostData.newPostContent, newPostTitle: manualPostData.newPostTitle, newPostProjectUri: projectData.uri})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .send({newPostContent: manualPostData.newPostContent, newPostTitle: manualPostData.newPostTitle, newPostProjectUri: projectData.uri})
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
            .post(path)
            .query({currentPage: pageNumber})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
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

