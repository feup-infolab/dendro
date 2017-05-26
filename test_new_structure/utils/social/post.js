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
            .set('Accept', 'text/html')
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
            .set('Accept', 'text/html')
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

var checkIfPostIsLikedByUser = function (jsonOnly, agent, postID, cb) {
    var path = "/posts/like/liked";
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

var getLikesInfoForAPost = function (jsonOnly, agent, postURI, cb) {
    var path = "/posts/post/likesInfo";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postURI : postURI})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postURI : postURI})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var addCommentToPost = function (jsonOnly, agent, postID, commentMsg, cb) {
    var path = "/posts/comment";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID : postID, commentMsg: commentMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID : postID, commentMsg: commentMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getPostComments = function (jsonOnly, agent, postID, cb) {
    var path = "/posts/comments";
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

var shareAPost = function (jsonOnly, agent, postID, shareMsg, cb) {
    var path = "/posts/share";
    if(jsonOnly)
    {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID : postID, shareMsg: shareMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else
    {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .send({postID : postID, shareMsg: shareMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

var getSharesForAPost = function (jsonOnly, agent, postID, cb) {
    var path = "/posts/shares";
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

var countNumPostInDB = function (jsonOnly, agent, cb) {
    var path = "/posts/countNum";
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
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

//TODO the postURL is only the characters after the last "/"
var getPostHTMLPageWithInfo = function (jsonOnly, agent, postURL, cb) {
    //var path = "/posts/" + postURL.;
    var path = postURL;
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
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

//TODO the shareURL is only the characters after the last "/"
var getAShareInfo = function (jsonOnly, agent, shareURL, cb) {
    var path = "/shares/" + shareURL;
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

module.exports = {
    getAllPostsFromUserProjects: getAllPostsFromUserProjects,
    getAPostInfo: getAPostInfo,
    likeOrUnlikeAPost: likeOrUnlikeAPost,
    checkIfPostIsLikedByUser: checkIfPostIsLikedByUser,
    getLikesInfoForAPost: getLikesInfoForAPost,
    addCommentToPost: addCommentToPost,
    getPostComments: getPostComments,
    shareAPost: shareAPost,
    getSharesForAPost: getSharesForAPost,
    countNumPostInDB: countNumPostInDB,
    getPostHTMLPageWithInfo: getPostHTMLPageWithInfo,
    getAShareInfo: getAShareInfo
};
