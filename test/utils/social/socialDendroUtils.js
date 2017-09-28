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

module.exports.getMySocialDendroTimeline = function (jsonOnly, agent, cb) {
    const path = "/socialDendro/my";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports.getAPostInfo = function (jsonOnly, agent, postUri, cb) {
    const path = "/posts/post";
    if (jsonOnly) {
        agent
            .get(path)
            .query({postID: postUri})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({postID: postUri})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getPostsArrayInfo = function(jsonOnly, agent, postURIsArray, cb) {
    const path = "/posts/posts";
    if (jsonOnly) {
        agent
            .get(path)
            .query({postsQueryInfo: postURIsArray})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({postsQueryInfo: postURIsArray})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getAPostLikesInfo = function (jsonOnly, agent, postURI, cb) {
    const path = "/posts/post/likes";
    if (jsonOnly) {
        agent
            .get(path)
            .query({postURI: postURI})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({postURI: postURI})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getAPostCommentsInfo = function (jsonOnly, agent, postID, cb) {
    const path = "/posts/comments";
    if (jsonOnly) {
        agent
            .get(path)
            .query({postID: postID})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({postID: postID})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getAPostSharesInfo = function (jsonOnly, agent, postID, cb) {
    const path = "/posts/shares";
    if (jsonOnly) {
        agent
            .get(path)
            .query({postID: postID})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({postID: postID})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getTotalPostsForAUsersSocialDendroTimeline = function (jsonOnly, agent, cb) {
    const path = "/posts/count";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getPostUriPage = function (jsonOnly, agent, postURI, cb) {
    const path = postURI;
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getShareUriPage = function (jsonOnly, agent, shareURI, cb) {
    const path = shareURI;
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.getAllUsersNotifications = function (jsonOnly, agent, cb) {
    const path = "/notifications/all";
    if (jsonOnly) {
        agent
            .get(path)
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};


module.exports.getANotificationInfo = function (jsonOnly, agent, notificationURI, cb) {
    const path = "/notifications/notification";
    if (jsonOnly) {
        agent
            .get(path)
            .query({notificationUri: notificationURI})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .get(path)
            .query({notificationUri: notificationURI})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

module.exports.deleteANotification = function (jsonOnly, agent, notificationURI, cb) {
    const path = "/notifications/notification";
    if (jsonOnly) {
        agent
            .del(path)
            .query({notificationUri: notificationURI})
            .set("Accept", "application/json")
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
    else {
        agent
            .del(path)
            .query({notificationUri: notificationURI})
            .set('Accept', 'text/html')
            .set("Content-Type", "application/json")
            .end(function (err, res) {
                cb(err, res);
            });
    }
};

