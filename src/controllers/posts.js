var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Post = require('../models/social/post.js').Post;
var MetadataChangePost = require('../models/social/metadataChangePost').MetadataChangePost;
var ManualPost = require("../models/social/manualPost").ManualPost;
var FileSystemPost = require('../models/social/fileSystemPost').FileSystemPost;
var Like = require('../models/social/like.js').Like;
var Notification = require('../models/notifications/notification.js').Notification;
var Comment = require('../models/social/comment.js').Comment;
var Share = require('../models/social/share.js').Share;
var Ontology = require('../models/meta/ontology.js').Ontology;
var Project = require('../models/project.js').Project;
var DbConnection = require("../kb/db.js").DbConnection;

var _ = require('underscore');

var async = require('async');
var flash = require('connect-flash');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notifications = function () { return GLOBAL.db.notifications;}();

var app = require('../app');

exports.numPostsDatabase = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUserUri = req.session.user.uri;
        Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
            if(!err)
            {
                async.map(projects, function (project, cb1) {
                    cb1(null, project.uri);
                }, function (err, projectsUris) {
                    if(!err)
                    {
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
                    }
                    else
                    {
                        console.error("Error iterating over projects URIs");
                        console.log(err);
                        res.status(500).json({
                            result : "Error",
                            message : "Error counting posts. " + JSON.stringify(err)
                        });
                    }
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
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};


exports.getUserPostsUris = function (userUri, currentPage, callback) {
    var index = currentPage == 1? 0 : (currentPage*5) - 5;
    var maxResults = 5;
    Project.findByCreatorOrContributor(userUri, function (err, projects) {
        if(!err)
        {
            async.map(projects, function (project, cb1) {
                cb1(null, project.uri);
            }, function (err, fullProjectsUris) {
                getAllPosts(fullProjectsUris,function (err, results) {
                    if(!err)
                    {
                        callback(err, results);
                    }
                    else{
                        console.error("Error getting a user post");
                        console.error(err);
                        callback(err, results)
                    }
                }, index, maxResults);
            })
        }
        else
        {
            console.error("Error finding user projects");
            console.error(projects);
            callback(err, projects)
        }
    });
};

exports.all = function(req, res){
    var currentUser = req.session.user;
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var currentPage = req.query.currentPage;
    var index = currentPage == 1? 0 : (currentPage*5) - 5;
    var maxResults = 5;

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        Project.findByCreatorOrContributor(currentUser.uri, function (err, projects) {
            if(!err)
            {
                async.map(projects, function (project, cb1) {
                    cb1(null, project.uri);
                }, function (err, fullProjectsUris) {
                    getAllPosts(fullProjectsUris,function (err, results) {
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
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.new = function(req, res){
    let currentUserUri = req.session.user.uri;
    if(req.body.newPostContent !==null && req.body.newPostTitle !==null && req.body.newPostProjectUri !==null)
    {
        Project.findByUri(req.body.newPostProjectUri, function (err, project) {
            if(!err && project)
            {
                project.isUserACreatorOrContributor(currentUserUri, function (err, results) {
                    if(!err)
                    {
                        if(Array.isArray(results) && results.length > 0)
                        {
                            //is a creator or contributor
                            //HERE BRO
                            let postInfo = {
                                title : req.body.newPostTitle,
                                body : req.body.newPostContent
                            };

                            ManualPost.buildManualPost(currentUserUri, project, postInfo, function (err, manualPost) {
                                if(!err && manualPost!==null)
                                {
                                    manualPost.save(function (err, result) {
                                        if(!err)
                                        {
                                            res.status(200).json({
                                                result : "OK",
                                                message : "Manual Post " + manualPost.uri + " successfully created"
                                            });
                                        }
                                        else
                                        {
                                            let errorMsg = "[Error] When saving a new manual post" + JSON.stringify(result);
                                            console.error(errorMsg);
                                            res.status(500).json({
                                                result: "Error",
                                                message: errorMsg
                                            });
                                        }
                                    }, false, null, null, null, null, db_social.graphUri);
                                }
                                else
                                {
                                    let errorMsg = "[Error] When creating a new manual post" + JSON.stringify(manualPost);
                                    console.error(errorMsg);
                                    res.status(500).json({
                                        result: "Error",
                                        message: errorMsg
                                    });
                                }
                            });
                        }
                        else
                        {
                            //is not a creator or contributor -> reject post creation
                            let errorMsg = "You are not creator or contributor of this Project";
                            res.status(401).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }
                    else
                    {
                        let errorMsg = "[Error] When checking if a user is a contributor or creator of a project: " + JSON.stringify(results);
                        res.status(500).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                });
            }
            else
            {
                let errorMsg = "[Error]: This project does not exist: " + JSON.stringify(project);
                console.error(errorMsg);
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db.graphUri, false, null, null);
    }
    else
    {
        let errorMsg = "Error saving post. The request body is missing a parameter(REQUIRED 'newPostContent'; 'newPostTitle', 'newPostProjectUri')";
        console.error(errorMsg);
        res.status(400).json({
            result: "Error",
            message: errorMsg
        });
    }
};


exports.getPost_controller = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var postURI = req.body.postID;

        var debugGraph = db_social.graphUri;
        Post.findByUri(req.body.postID, function(err, post)
        {
            if(!err)
            {

                if(!post)
                {
                    var errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else
                {
                    //app.io.emit('chat message', post);
                    var eventMsg = 'postURI:' + postURI.uri;
                    //var eventMsg = 'postURI:';
                    //app.io.emit(eventMsg, post);
                    res.json(post);
                }
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error getting a post. " + JSON.stringify(post)
                });
            }
        }, null, db_social.graphUri, false, null, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.share = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var shareMsg = req.body.shareMsg;
        Post.findByUri(req.body.postID, function(err, post)
        {
            if(!err)
            {
                if(!post)
                {
                    var errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else
                {
                    /*var newShare = new Share({
                        ddr: {
                            userWhoShared : currentUser.uri,
                            postURI: post.uri,
                            shareMsg: shareMsg,
                            projectUri: post.ddr.projectUri
                        },
                        dcterms: {
                            creator: currentUser.uri
                        },
                        rdf: {
                            isShare : true
                        }
                    });*/

                    var newShareData = {
                        ddr: {
                            userWhoShared : currentUser.uri,
                            postURI: post.uri,
                            shareMsg: shareMsg,
                            projectUri: post.ddr.projectUri
                        },
                        dcterms: {
                            creator: currentUser.uri
                        },
                        rdf: {
                            isShare : true
                        }
                    };

                    Share.buildFromInfo(newShareData, function (err, newShare) {
                        var newNotification = new Notification({
                            ddr: {
                                userWhoActed : currentUser.uri,
                                resourceTargetUri: post.uri,
                                actionType: "Share",
                                resourceAuthorUri: post.dcterms.creator,
                                shareURI : newShare.uri
                            },
                            foaf :
                                {
                                    status : "unread"
                                }
                        });

                        newShare.save(function(err, resultShare)
                        {
                            if(!err)
                            {
                                /*
                                 res.json({
                                 result : "OK",
                                 message : "Post shared successfully"
                                 });*/
                                newNotification.save(function (error, resultNotification) {
                                    if(!error)
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
                                            message: "Error saving a notification for a Share " + JSON.stringify(resultNotification)
                                        });
                                    }
                                }, false, null, null, null, null, db_notifications.graphUri);
                            }
                            else
                            {
                                console.error("Error share a post");
                                console.error(err);
                                res.status(500).json({
                                    result: "Error",
                                    message: "Error sharing a post. " + JSON.stringify(resultShare)
                                });
                            }

                        }, false, null, null, null, null, db_social.graphUri);
                    });
                }
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error sharing a post. " + JSON.stringify(post)
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.getPostComments = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var postUri = req.body.postID;

        Post.findByUri(req.body.postID, function(err, post)
        {
            if(!err && post != null)
            {
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
            }
            else
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.comment = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var commentMsg = req.body.commentMsg;

        Post.findByUri(req.body.postID, function(err, post)
        {
            if(!err && post != null)
            {
                var newComment = new Comment({
                    ddr: {
                        userWhoCommented : currentUser.uri,
                        postURI: post.uri,
                        commentMsg: commentMsg
                    }
                });

                var newNotification = new Notification({
                    ddr: {
                        userWhoActed : currentUser.uri,
                        resourceTargetUri: post.uri,
                        actionType: "Comment",
                        resourceAuthorUri: post.dcterms.creator
                    },
                    foaf :
                        {
                            status : "unread"
                        }
                });

                newComment.save(function(err, resultComment)
                {
                    if(!err)
                    {
                        /*
                         res.json({
                         result : "OK",
                         message : "Post commented successfully"
                         });*/
                        newNotification.save(function (error, resultNotification) {
                            if(!error)
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
                                    message: "Error saving a notification for a Comment " + JSON.stringify(resultNotification)
                                });
                            }
                        }, false, null, null, null, null, db_notifications.graphUri);
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error Commenting a post. " + JSON.stringify(resultComment)
                        });
                    }

                }, false, null, null, null, null, db_social.graphUri);
            }
            else
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }

    /*Post.findByUri(req.body.postID, function(err, post)
    {
        var newComment = new Comment({
            ddr: {
                userWhoCommented : currentUser.uri,
                postURI: post.uri,
                commentMsg: commentMsg
            }
        });

        var newNotification = new Notification({
            ddr: {
                userWhoActed : currentUser.uri,
                resourceTargetUri: post.uri,
                actionType: "Comment",
                resourceAuthorUri: post.dcterms.creator
            },
            foaf :
            {
                status : "unread"
            }
        });

        newComment.save(function(err, resultComment)
        {
            if(!err)
            {
                /!*
                res.json({
                    result : "OK",
                    message : "Post commented successfully"
                });*!/
                newNotification.save(function (error, resultNotification) {
                    if(!error)
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
                            message: "Error saving a notification for a Comment " + JSON.stringify(resultNotification)
                        });
                    }
                }, false, null, null, null, null, db_notifications.graphUri);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error Commenting a post. " + JSON.stringify(resultComment)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri, null);*/
};

exports.checkIfPostIsLikedByUser = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var postID = req.body.postID;
        var currentUser = req.session.user;

        Post.findByUri(postID, function(err, post)
        {
            if(!err && post != null)
            {
                userLikedAPost(post.uri, currentUser.uri, function (err, isLiked) {
                    if(!err)
                        res.json(isLiked);
                    else
                        res.status(500).json({
                            result: "Error",
                            message: "Error getting verifying if a user liked a post in a post. " + JSON.stringify(isLiked)
                        });
                });
            }
            else
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.like = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        removeOrAdLike(req.body.postID, currentUser.uri, function (err, likeExists) {
            if(!err)
            {
                if(likeExists)
                {
                    //like was removed
                    res.json({
                        result : "OK",
                        message : "Like was removed"
                    });
                }
                else
                {
                    Post.findByUri(req.body.postID, function(err, post)
                    {
                        if(!err && post != null)
                        {
                            var newLike = new Like({
                                ddr: {
                                    userWhoLiked : currentUser.uri,
                                    postURI: post.uri
                                }
                            });

                            //resourceTargetUri -> a post etc
                            //resourceAuthorUri -> the author of the post etc
                            //userWhoActed -> user who commmented/etc
                            //actionType -> comment/like/share
                            //status-> read/unread

                            var newNotification = new Notification({
                                ddr: {
                                    userWhoActed : currentUser.uri,
                                    resourceTargetUri: post.uri,
                                    actionType: "Like",
                                    resourceAuthorUri: post.dcterms.creator
                                },
                                foaf :
                                    {
                                        status : "unread"
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
                                    }, false, null, null, null, null, db_notifications.graphUri);
                                }
                                else
                                {
                                    res.status(500).json({
                                        result: "Error",
                                        message: "Error Liking a post. " + JSON.stringify(resultLike)
                                    });
                                }

                            }, false, null, null, null, null, db_social.graphUri);
                        }
                        else
                        {
                            var errorMsg = "Invalid post uri";
                            res.status(404).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }, null, db_social.graphUri, null);
                }
            }
        });
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

var numPostsDatabaseAux = function (projectUrisArray, callback) {
    /*WITH <http://127.0.0.1:3001/social_dendro>
     SELECT (COUNT(DISTINCT ?postURI) AS ?count)
     WHERE {
     ?postURI rdf:type ddr:Post.
     }*/
    if(projectUrisArray && projectUrisArray.length > 0)
    {
        async.map(projectUrisArray, function (uri, cb1) {
            cb1(null, '<'+uri+ '>');
        }, function (err, fullProjectsUris) {
            var projectsUris = fullProjectsUris.join(" ");
            var query =
                "WITH [0] \n" +
                "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                "VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost" + " ddr:FileSystemPost" + " ddr:ManualPost" +
                "} \n" +
                "?uri rdf:type ?postTypes. \n" +
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
        });
    }
    else
    {
        //User has no projects
        var results = 0;
        callback(null, results);
    }
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
        "?commentURI dcterms:modified ?date. \n " +
        "} \n" +
        "ORDER BY ASC(?date) \n";

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
                    //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
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
                    //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
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

exports.getPostShares = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var postUri = req.body.postID;

        Post.findByUri(postUri, function(err, post)
        {
            if(!err && post != null)
            {
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
            }
            else
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.postLikesInfo = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.session.user;
        var postURI = req.body.postURI;
        var resultInfo;

        Post.findByUri(postURI, function(err, post)
        {
            if(!err && post != null)
            {
                getNumLikesForAPost(post.uri, function (err, likesArray) {
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
            }
            else
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
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
                    cb(err, true);
                else
                    cb(err, false);
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
var getAllPosts = function (projectUrisArray, callback, startingResultPosition, maxResults) {
    //based on getRecentProjectWideChangesSocial
    var self = this;

    if(projectUrisArray && projectUrisArray.length > 0)
    {
        async.map(projectUrisArray, function (uri, cb1) {
            cb1(null, '<'+uri+ '>');
        }, function (err, fullProjects) {
            var projectsUris = fullProjects.join(" ");
            var query =
                "WITH [0] \n" +
                "SELECT DISTINCT ?uri \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                "VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost"  + " ddr:FileSystemPost" + " ddr:ManualPost"+
                "} \n" +
                "?uri dcterms:modified ?date. \n" +
                "?uri rdf:type ?postTypes. \n" +
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
        });
    }
    else
    {
        //User has no projects
        var results = [];
        callback(null, results);
    }
};

exports.post = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var currentUser = req.session.user;
    var postUri = "http://"+Config.host + req.url;

    var getCommentsForAPost = function (post, cb) {
        post.getComments(function (err, commentsData) {
            cb(err, commentsData);
        });
    };

    var getLikesForAPost = function (post, cb) {
        post.getLikes(function (err, likesData) {
            cb(err, likesData);
        });
    };

    var getSharesForAPost = function (post, cb) {
        post.getShares(function (err, sharesData) {
            cb(err, sharesData);
        });
    };

    var getChangesFromMetadataChangePost = function (metadataChangePost, cb) {
        metadataChangePost.getChangesFromMetadataChangePost(function (err, changesData) {
            cb(err, changesData);
        });
    };

    var getResourceInfoFromFileSystemPost = function (fileSystemPost, cb) {
        fileSystemPost.getResourceInfo(function (err, resourceInfo) {
           cb(err, resourceInfo);
        });
    };

    Post.findByUri(postUri, function(err, post)
    {
        if(!err && post != null)
        {
            if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                async.series([
                        function(callback) {
                            getCommentsForAPost(post, function (err, commentsData) {
                                post.commentsContent = commentsData;
                                callback(err);
                            });
                        },
                        function(callback) {
                            getLikesForAPost(post, function (err, likesData) {
                                post.likesContent = likesData;
                                callback(err);
                            });
                        },
                        function (callback) {
                            getSharesForAPost(post, function (err, sharesData) {
                                post.sharesContent = sharesData;
                                callback(err);
                            });
                        },
                        function (callback) {
                            //TODO HOW TO ACCESS THE FULL TYPE
                            if(post.rdf.type === "http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost")
                            {
                                MetadataChangePost.findByUri(post.uri, function (err, metadataChangePost) {
                                    if(!err)
                                    {
                                        getChangesFromMetadataChangePost(metadataChangePost, function (err, changesInfo) {
                                            //[editChanges, addChanges, deleteChanges]
                                            post.changesInfo = changesInfo;
                                            callback(err);
                                        });
                                    }
                                    else
                                    {
                                        console.error("Error getting a metadataChangePost");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else if(post.rdf.type === "http://dendro.fe.up.pt/ontology/0.1/FileSystemPost")
                            {
                                FileSystemPost.findByUri(post.uri, function (err, fileSystemPost) {
                                    if(!err)
                                    {
                                        getResourceInfoFromFileSystemPost(fileSystemPost, function (err, resourceInfo) {
                                            post.resourceInfo = resourceInfo;
                                            callback(err);
                                        });
                                    }
                                    else
                                    {
                                        console.error("Error getting a File System Post");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else
                            {
                                callback(null);
                            }
                        }
                    ],
                    function(err, results) {
                        res.json(post);
                    });
            }
            else
            {
                res.render('social/showPost',
                    {
                        postUri : postUri
                    }
                );
            }
        }
        else
        {
            if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                var errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else
            {
                 flash('error', "Unable to retrieve the post : " + postUri);
                 res.render('index',
                 {
                     error_messages : ["Post " + postUri + " not found."]
                 });
            }
        }
    }, null, db_social.graphUri, false, null, null);
};

exports.getShare = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    var currentUser = req.session.user;
    var shareUri = "http://"+req.headers.host + req.url;

    Share.findByUri(shareUri, function(err, share)
    {
        if(!err && share != null)
        {
            if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {

                async.parallel([
                        function(callback) {
                            getCommentsForAPost(share.uri, function (err, commentsData) {
                                callback(err, commentsData);
                            });
                        },
                        function(callback) {
                            getLikesForAPost(share.uri, function (err, likesData) {
                                callback(err, likesData);
                            });
                        },
                        function (callback) {
                            getSharesForAPost(share.uri, function (err, sharesData) {
                                callback(err, sharesData);
                            });
                        }
                    ],
                    // optional callback
                    function(err, results) {
                        share.commentsContent = results[0];
                        share.likesContent = results[1];
                        share.sharesContent = results[2];
                        res.json(share);
                    });
            }
            else
            {
                res.render('social/showShare',
                    {
                        shareUri : shareUri
                    }
                );
            }
        }
        else
        {
            if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                var errorMsg = "Invalid share uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else
            {
                flash('error', "Unable to retrieve the share : " + shareUri);
                res.render('index',
                    {
                        error_messages : ["Share " + shareUri + " not found."]
                    });
            }
        }
    }, null, db_social.graphUri, null);
};


//AUX FUNCTIONS
var getLikesForAPost = function (postUri, callback) {
    let resultInfo;
    Post.findByUri(postUri, function(err, post)
    {
        if(!err && post != null)
        {
            getNumLikesForAPost(post.uri, function (err, likesArray) {
                if(!err)
                {
                    if(likesArray.length)
                    {
                        resultInfo = {
                            postURI: post.uri, numLikes : likesArray.length, usersWhoLiked : _.pluck(likesArray, 'userURI')
                        };
                    }
                    else
                    {
                        resultInfo = {
                            postURI: post.uri, numLikes : 0, usersWhoLiked : 'undefined'
                        };
                    }
                    callback(null, resultInfo);
                }
                else
                {
                    console.error("Error getting likesInfo from a post");
                    console.error(err);
                    callback(true, "Error getting likesInfo from a post");
                }

            });
        }
        else
        {
            var errorMsg = "Invalid post uri";
            console.error(err);
            console.error(errorMsg);
        }
    }, null, db_social.graphUri, null);
};
