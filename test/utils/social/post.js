const chai = require("chai");
const chaiHttp = require("chai-http");
const _ = require("underscore");
chai.use(chaiHttp);

const getAllPostsFromUserProjects = function (jsonOnly, agent, cb) {
    // /posts/all
    const path = '/posts/all';
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getAPostInfo = function (jsonOnly, agent, postID, cb) {
    // /posts/post
    const path = '/posts/post';
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Accept', 'text/html')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const likeOrUnlikeAPost = function (jsonOnly, agent, postID, cb) {
    // /posts/like
    const path = '/posts/like';
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const checkIfPostIsLikedByUser = function (jsonOnly, agent, postID, cb) {
    const path = "/posts/like/liked";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getLikesInfoForAPost = function (jsonOnly, agent, postURI, cb) {
    const path = "/posts/post/likesInfo";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postURI: postURI})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postURI: postURI})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const addCommentToPost = function (jsonOnly, agent, postID, commentMsg, cb) {
    const path = "/posts/comment";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID, commentMsg: commentMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID, commentMsg: commentMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getPostComments = function (jsonOnly, agent, postID, cb) {
    const path = "/posts/comments";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const shareAPost = function (jsonOnly, agent, postID, shareMsg, cb) {
    const path = "/posts/share";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID, shareMsg: shareMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID, shareMsg: shareMsg})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const getSharesForAPost = function (jsonOnly, agent, postID, cb) {
    const path = "/posts/shares";
    if (jsonOnly) {
        agent
            .post(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .post(path)
            .set('Content-Type', 'application/json')
            .send({postID: postID})
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

const countNumPostInDB = function (jsonOnly, agent, cb) {
    const path = "/posts/countNum";
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

//TODO the postURL is only the characters after the last "/"
const getPostHTMLPageWithInfo = function (jsonOnly, agent, postURL, cb) {
    const path = "/posts/" + postURL;
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

//TODO the shareURL is only the characters after the last "/"
const getAShareInfo = function (jsonOnly, agent, shareURL, cb) {
    const path = "/shares/" + shareURL;
    if (jsonOnly) {
        agent
            .get(path)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
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
