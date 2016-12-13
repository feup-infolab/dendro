var Post = require('../models/social/post.js').Post;
var Like = require('../models/social/like.js').Like;
var Notification = require('../models/social/notification.js').Notification;
var Comment = require('../models/social/comment.js').Comment;
var Share = require('../models/social/share.js').Share;
var Ontology = require('../models/meta/ontology.js').Ontology;
var Project = require('../models/project.js').Project;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var app = require('../app');

exports.numPostsDatabase = function (req, res) {
    var currentUserUri = req.session.user.uri;
    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
        if(!err)
        {
            async.map(projects, function (project, cb1) {
                cb1(null, '<'+project.uri+ '>');
            }, function (err, fullProjects) {
                var projectsUris = fullProjects.join(" ");
                numPostsDatabaseAux(projectsUris,function (err, count) {
                    if(!err)
                    {
                        res.json(count);
                    }
                    else{
                        res.status(500).json({
                            result : "Error",
                            message : "Error counting posts. " + JSON.stringify(err)
                        });
                    }
                });
            })
        }
        else
        {
            res.status(500).json({
                result : "Error",
                message : "Error finding user projects"
            });
        }
    });
};

exports.all = function(req, res){
    var currentUser = req.session.user;
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var username = currentUser.uri;

    var pingForNewPosts = true;
    var currentPage = req.query.currentPage;
    var index = currentPage == 1? 0 : (currentPage*5) - 5;
    var maxResults = 5;

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        if(pingForNewPosts)
        {
            pingNewPosts(currentUser, function (error, newposts) {
                if(error)
                {
                    res.status(500).json({
                        result : "Error",
                        message : "Error pinging posts. " + JSON.stringify(error)
                    });
                }
                else
                {
                    Project.findByCreatorOrContributor(currentUser.uri, function (err, projects) {
                        if(!err)
                        {
                            async.map(projects, function (project, cb1) {
                                cb1(null, '<'+project.uri+ '>');
                            }, function (err, fullProjects) {
                                var projectsUris = fullProjects.join(" ");
                                getAllPosts(projectsUris,function (err, results) {
                                    if(!err)
                                    {
                                        res.json(results);
                                    }
                                    else{
                                        res.status(500).json({
                                            result : "Error",
                                            message : "Error getting posts. " + JSON.stringify(err)
                                        });
                                    }
                                }, index, maxResults);
                            })
                        }
                        else
                        {
                            res.status(500).json({
                                result : "Error",
                                message : "Error finding user projects"
                            });
                        }
                    });
                    /*
                    getAllPosts(function (err, results) {
                        if(!err)
                        {
                            res.json(results);
                        }
                        else{
                            res.status(500).json({
                                result : "Error",
                                message : "Error getting posts. " + JSON.stringify(err)
                            });
                        }
                    }, index, maxResults);*/
                }
            });
        }
        else
        {
            Post.all(req, function (err, posts)
            {
                if (!err)
                {
                    async.map(posts, function(post, callback){

                        Post.findByUri(post.uri, function (err, loadedPost) {
                            if(err)
                                callback(err, null);
                            else
                            {
                                callback(null, loadedPost);
                            }

                        }, Ontology.getAllOntologiesUris(), db_social.graphUri)
                    }, function(err, loadedPosts){
                        if(!err)
                        {
                            loadedPosts.sort(sortPostsByModifiedDate);//sort posts by modified date
                            res.json(loadedPosts);
                        }
                        else
                        {
                            res.status(500).json({
                                result : "Error",
                                message : "Error retrieving post contents. " + JSON.stringify(err)
                            });
                        }
                    });

                }
                else
                {
                    res.status(500).json({
                        result : "Error",
                        message : "Error retrieving post URIs. " + JSON.stringify(err)
                    });
                }
            }, db_social.graphUri, false);
        }
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

function sortPostsByModifiedDate(postA, postB) {
    var a = new Date(postA.dcterms.modified),
        b = new Date(postB.dcterms.modified);
    return (a.getTime() - b.getTime());
}

//function that pings metadata changes from dendro_graph to build the posts in social_dendro graph
function pingNewPosts(sessionUser, cb) {
    var currentUserUri = sessionUser.uri;
    var numPostsCreated = 0;
    Project.findByCreatorOrContributor(currentUserUri, function(err, projects) {
        if(!err)
        {
            if(projects.length > 0)
            {
                async.map(projects, function (project, cb1) {
                        var socialUpdatedAt = project.dcterms.socialUpdatedAt ? project.dcterms.socialUpdatedAt : '1970-09-21T19:27:46.578Z';
                        project.getRecentProjectWideChangesSocial(function(err, changes){
                            if(!err)
                            {
                                if(changes.length > 0)
                                {
                                    async.map(changes, function(change, callback){
                                            if(change.changes && change.changes[0])// change.changes[0])
                                            {
                                                var newPost = new Post({
                                                    ddr: {
                                                        changeType: change.changes[0].ddr.changeType,
                                                        newValue: change.changes[0].ddr.newValue,
                                                        changedDescriptor: change.changes[0].ddr.changedDescriptor? change.changes[0].ddr.changedDescriptor.label : 'undefined',
                                                        hasContent: change.changes[0].uri,
                                                        numLikes: 0,
                                                        projectUri: project.uri
                                                    },
                                                    dcterms: {
                                                        creator : currentUserUri,
                                                        title: project.dcterms.title
                                                    }
                                                });

                                                newPost.save(function(err, post)
                                                {
                                                    if (!err)
                                                    {
                                                        numPostsCreated++;
                                                        callback(err, post);
                                                    }
                                                    else
                                                    {
                                                        callback(err, post);
                                                    }
                                                }, false, null, null, null, null, db_social.graphUri);
                                            }
                                            else
                                            {
                                                callback(null,null);
                                            }
                                        },
                                        function(err, fullDescriptors)
                                        {
                                            if(!err)
                                            {
                                                var updatedProject = project;
                                                updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                                                updateResource(project, updatedProject, db.graphUri, function (error, data) {
                                                    cb1(error, fullDescriptors);
                                                });
                                            }
                                            else
                                            {
                                                var errorMsg = "Error at project changes";
                                                console.log(errorMsg);
                                                cb1(err, errorMsg);
                                            }
                                        });
                                }
                                else
                                {
                                    //no changes detected
                                    var updatedProject = project;
                                    updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                                    updateResource(project, updatedProject, db.graphUri, function (error, data) {
                                        cb1(error,data);
                                    });
                                }
                            }
                            else
                            {
                                var errorMsg = "Error getting recent project wide social changes";
                                cb1(err,errorMsg);
                            }
                        },null,null,socialUpdatedAt);
                    },
                    function (err, fullProjects) {
                        //fullProjects.length is fullProjects.length
                        //numPostCreated is numPostsCreated
                        cb(err, fullProjects);
                    });
            }
            else
            {
                cb(null,null);
            }
        }
        else
        {
            var errorMsg = "Error finding projects by creator or contributor";
            callback(err, errorMsg);
        }

    });

}

exports.new = function(req, res){
    /*
     var currentUser = req.session.user;

     if(req.body.new_post_content != null)
     {
     var newPost = new Post({
     ddr: {
     hasContent: req.body.new_post_content
     },
     dcterms: {
     creator : currentUser.uri
     }
     });

     newPost.save(function(err, post)
     {
     if (!err)
     {
     res.json({
     result : "OK",
     message : "Post saved successfully"
     });
     }
     else
     {
     res.status(500).json({
     result: "Error",
     message: "Error saving post. " + JSON.stringify(post)
     });
     }
     }, false, null, null, null, null, db_social.graphUri);
     }
     else
     {
     res.status(400).json({
     result: "Error",
     message: "Error saving post. The request body does not contain the content of the new post (new_body_content field missing)"
     });
     }*/
    var cenas = 'http://127.0.0.1:3001/posts/34240860-82bd-47c9-95fe-5b872451844d';
    getNumLikesForAPost(cenas, function (err, data) {
        /*
         res.json({
         result : "OK",
         message : "Post liked successfully"
         });*/
    });
};


exports.getPost_controller = function (req, res) {
    var currentUser = req.session.user;
    var postURI = req.body.postID;
    Post.findByUri(req.body.postID, function(err, post)
    {
        if(!err)
        {
            //app.io.emit('chat message', post);
            var eventMsg = 'postURI:' + postURI.uri;
            //var eventMsg = 'postURI:';
            //app.io.emit(eventMsg, post);
            res.json(post);
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting a post. " + JSON.stringify(post)
            });
        }
    }, null, db_social.graphUri);
};

exports.share = function (req, res) {
    var currentUser = req.session.user;
    var shareMsg = req.body.shareMsg;
    Post.findByUri(req.body.postID, function(err, post)
    {
        var newShare = new Share({
            ddr: {
                userWhoShared : currentUser.uri,
                postURI: post.uri,
                shareMsg: shareMsg,
                projectUri: post.ddr.projectUri
            }
        });

        newShare.save(function(err, resultShare)
        {
            if(!err)
            {
                res.json({
                    result : "OK",
                    message : "Post shared successfully"
                });
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error sharing a post. " + JSON.stringify(resultShare)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri);
};

exports.getPostComments = function (req, res) {
    var currentUser = req.session.user;
    var postUri = req.body.postID;
    getCommentsForAPost(postUri, function (err, comments) {
        if(err)
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting comments from a post " + JSON.stringify(comments)
            });
        }
        else
        {
            res.json(comments);
        }
    });

};

exports.comment = function (req, res) {
    var currentUser = req.session.user;
    var commentMsg = req.body.commentMsg;
    Post.findByUri(req.body.postID, function(err, post)
    {
        var newComment = new Comment({
            ddr: {
                userWhoCommented : currentUser.uri,
                postURI: post.uri,
                commentMsg: commentMsg
            }
        });

        newComment.save(function(err, resultComment)
        {
            if(!err)
            {
                res.json({
                    result : "OK",
                    message : "Post commented successfully"
                });
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error Commenting a post. " + JSON.stringify(resultComment)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri);
};

exports.checkIfPostIsLikedByUser = function (req, res) {
    var postID = req.body.postID;
    var currentUser = req.session.user;

    userLikedAPost(postID, currentUser.uri, function (err, isLiked) {
        if(!err)
            res.json(isLiked);
        else
            res.status(500).json({
                result: "Error",
                message: "Error getting numLikes in a post. " + JSON.stringify(isLiked)
            });
    });
};

exports.like = function (req, res) {
    var currentUser = req.session.user;
    removeOrAdLike(req.body.postID, currentUser.uri, function (err, likeExists) {
        if(!err)
        {
            if(likeExists)
            {
                //like was removed
                res.json({
                    result : "OK",
                    message : "Post already liked"
                });
            }
            else
            {
                Post.findByUri(req.body.postID, function(err, post)
                {
                    var updatedPost = post;
                    var newLike = new Like({
                        ddr: {
                            userWhoLiked : currentUser.uri,
                            postURI: post.uri
                        }
                    });
                    
                    var newNotification = new Notification({
                       ddr: {
                           userWhoActed : currentUser.uri,
                           postURI: post.uri,
                           actionType: "Like",
                           authorUri: post.dcterms.creator
                       }
                    });

                    newLike.save(function(err, resultLike)
                    {
                        if(!err)
                        {
                            newNotification.save(function (error, resultNotification) {
                                if(!error)
                                {
                                    res.json({
                                        result : "OK",
                                        message : "Post liked successfully"
                                    });
                                }
                                else
                                {
                                    res.status(500).json({
                                        result: "Error",
                                        message: "Error saving a notification for a Like " + JSON.stringify(resultNotification)
                                    });
                                }
                            }, false, null, null, null, null, db_social.graphUri);
                        }
                        else
                        {
                            res.status(500).json({
                                result: "Error",
                                message: "Error Liking a post. " + JSON.stringify(resultLike)
                            });
                        }

                    }, false, null, null, null, null, db_social.graphUri);
                }, null, db_social.graphUri);
            }
        }
    });
};

/*var updateResource = function(currentResource, newResource, graphUri, cb)
{
    var descriptors = newResource.getDescriptors();

    db.connection.replaceDescriptorsOfSubject(
        currentResource.uri,
        descriptors,
        graphUri,
        function(err, result)
        {
            cb(err, result);
        }
    );
};*/

var numPostsDatabaseAux = function (projectUris, callback) {
    /*WITH <http://127.0.0.1:3001/social_dendro>
    SELECT (COUNT(DISTINCT ?postURI) AS ?count)
    WHERE {
        ?postURI rdf:type ddr:Post.
    }*/
    if(projectUris && projectUris.length > 0)
    {
        var query =
            "WITH [0] \n" +
            "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
            "WHERE { \n" +
            "VALUES ?project { \n" +
            projectUris +
            "} \n" +
            "?uri rdf:type ddr:Post. \n" +
            "?uri ddr:projectUri ?project. \n" +
            "} \n ";

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_social.graphUri
                }
            ]),
            function(err, results) {
                if(!err)
                {
                    callback(err,results[0].count);
                }
                else
                {
                    callback(true, "Error fetching numPosts in numPostsDatabaseAux");
                }
            });
    }
    else
    {
        //User has no projects
        var results = 0;
        callback(null, results);
    }
};

var updateResource = function(currentResource, newResource, graphUri, cb)
{
    var newDescriptors= newResource.getDescriptors();

    currentResource.replaceDescriptorsInTripleStore(
        newDescriptors,
        graphUri,
        function(err, result)
        {
            cb(err, result);
        }
    );
};

var removeLike = function (likeID, userUri, cb) {
    var self = this;

    var query =
        "WITH [0] \n" +
        //"DELETE {?likeURI ?p ?v}\n" +
        "DELETE {[1] ?p ?v}\n" +
        //"FROM [0] \n" +
        "WHERE { \n" +
        "[1] ?p ?v \n" +
        //"?likeURI ddr:postURI ?postID \n" +
        //"?likeURI rdf:type ddr:Like. \n" +
        //"?likeURI ddr:postURI [1]. \n" +
        //"?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : likeID
            }
        ]),
        function(err, results) {
            if(!err)
            {
                var likeExists = false;
                if(results.length > 0)
                {
                    likeExists = true;
                }
                cb(false, likeExists);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var removeOrAdLike = function (postID, userUri, cb) {
    var self = this;

    var query =
        "SELECT ?likeURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : postID
            },
            {
                type : DbConnection.resource,
                value : userUri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                var likeExists = false;
                if(results.length > 0)
                {
                    removeLike(results[0].likeURI, userUri, function (err, data) {
                        likeExists = true;
                        cb(err, likeExists);
                    });
                }
                else
                    cb(err, likeExists);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};


var getCommentsForAPost = function (postID, cb) {
    var self = this;

    var query =
        "SELECT ?commentURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?commentURI rdf:type ddr:Comment. \n" +
        "?commentURI ddr:postURI [1]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : postID
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.map(results, function(commentUri, callback){
                    Comment.findByUri(commentUri.commentURI, function(err, comment)
                    {
                        callback(false,comment);
                    }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                }, function (err, comments) {
                    cb(false, comments);
                });
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var getSharesForAPost = function (postID, cb) {
    var self = this;

    var query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:postURI [1]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : postID
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.map(results, function(shareObject, callback){
                    Share.findByUri(shareObject.shareURI, function(err, share)
                    {
                        callback(false,share);
                    }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                }, function (err, shares) {
                    cb(false, shares);
                });
            }
            else
            {
                cb(true, "Error shares for a post");
            }
        });
};

function saveCurrentUserInRedis(req, res) {
    var redis = require("redis");
    client = redis.createClient();

}

exports.getLoggedUser = function (req, res) {
    var loggedUser = req.session.user;
    res.json(loggedUser);
};

exports.getPostShares = function (req, res) {
    var currentUser = req.session.user;

    var postUri = req.body.postID;


    getSharesForAPost(postUri, function (err, shares) {
        if(err)
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting shares from a post " + JSON.stringify(shares)
            });
        }
        else
        {
            res.json(shares);
        }
    });

};

exports.postLikesInfo = function (req, res) {
    var currentUser = req.session.user;
    var postURI = req.body.postURI;
    var resultInfo;

    getNumLikesForAPost(postURI, function (err, likesArray) {
        if(!err)
        {
            if(likesArray.length)
            {
                resultInfo = {
                    postURI: postURI, numLikes : likesArray.length, usersWhoLiked : _.pluck(likesArray, 'userURI')
                };
            }
            else
            {
                resultInfo = {
                    postURI: postURI, numLikes : 0, usersWhoLiked : 'undefined'
                };
            }
            res.json(resultInfo);
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting likesInfo from a post " + JSON.stringify(err)
            });
        }

    });
};

var userLikedAPost = function(postID, userUri, cb )
{
    var self = this;

    var query =
        "SELECT ?likeURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : postID
            },
            {
                type : DbConnection.resource,
                value : userUri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                if(results.length > 0)
                    cb(false, true);
                else
                    cb(false, true);
            }
            else
            {
                cb(true, "Error checking if a post is liked by a user");
            }
        });
};

var getNumLikesForAPost = function(postID, cb)
{
    var self = this;

    var query =
        "SELECT ?likeURI ?userURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked ?userURI . \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : postID
            }
        ]),
        function(err, results) {
            if(!err)
            {
                cb(false, results);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

/**
 * Gets all the posts ordered by modified date and using pagination
 * @param callback the function callback
 * @param startingResultPosition the starting position to start the query
 * @param maxResults the limit for the query
 */
var getAllPosts = function (projectUris, callback, startingResultPosition, maxResults) {
    //based on getRecentProjectWideChangesSocial
    var self = this;

    if(projectUris && projectUris.length > 0)
    {
        var query =
            "WITH [0] \n" +
            "SELECT DISTINCT ?uri \n" +
            "WHERE { \n" +
            "VALUES ?project { \n" +
            projectUris +
            "} \n" +
            "?uri dcterms:modified ?date. \n" +
            "?uri rdf:type ddr:Post. \n" +
            "?uri ddr:projectUri ?project. \n" +
            "} \n "+
            "ORDER BY DESC(?date) \n";

        query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_social.graphUri
                }
            ]),
            function(err, results) {
                if(!err)
                {
                    callback(err,results);
                }
                else
                {
                    callback(true, "Error fetching posts in getAllPosts");
                }
            });
    }
    else
    {
        //User has no projects
        var results = [];
        callback(null, results);
    }
};