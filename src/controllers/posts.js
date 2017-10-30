const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Post = require('../models/social/post.js').Post;
const Like = require('../models/social/like.js').Like;
const Notification = require('../models/notifications/notification.js').Notification;
const Comment = require('../models/social/comment.js').Comment;
const Share = require('../models/social/share.js').Share;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Project = require('../models/project.js').Project;
const DbConnection = require("../kb/db.js").DbConnection;
const MetadataChangePost = require('../models/social/metadataChangePost').MetadataChangePost;
const ManualPost = require("../models/social/manualPost").ManualPost;
const FileSystemPost = require('../models/social/fileSystemPost').FileSystemPost;
const _ = require("underscore");

var flash = require('connect-flash');

const async = require("async");
const db = Config.getDBByID();
const db_social = Config.getDBByID("social");
const db_notifications = Config.getDBByID("notifications");

const app = require('../app');


/**
 * Gets all the posts ordered by modified date and using pagination
 * @param callback the function callback
 * @param startingResultPosition the starting position to start the query
 * @param maxResults the limit for the query
 */
const getAllPosts = function (projectUrisArray, callback, startingResultPosition, maxResults) {
    //based on getRecentProjectWideChangesSocial
    const self = this;

    if (projectUrisArray && projectUrisArray.length > 0) {
        async.mapSeries(projectUrisArray, function (uri, cb1) {
            cb1(null, '<' + uri + '>');
        }, function (err, fullProjects) {
            const projectsUris = fullProjects.join(" ");
            let query =
                "WITH [0] \n" +
                //"SELECT DISTINCT ?uri ?postTypes\n" +
                "SELECT DISTINCT ?uri\n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                /*"VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost" + " ddr:FileSystemPost" + " ddr:ManualPost" +
                "} \n" +*/
                "?uri ddr:modified ?date. \n" +
                //"?uri rdf:type ?postTypes. \n" +
                "?uri rdf:type ddr:Post. \n" +
                "?uri ddr:projectUri ?project. \n" +
                "} \n " +
                "ORDER BY DESC(?date) \n";

            query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

            db.connection.executeViaJDBC(query,
                DbConnection.pushLimitsArguments([
                    {
                        type : Elements.types.resourceNoEscape,
                        value: db_social.graphUri
                    }
                ]),
                function (err, results) {
                    if (isNull(err)) {
                        return callback(err, results);
                    }
                    else {
                        return callback(true, "Error fetching posts in getAllPosts");
                    }
                });
        });
    }
    else {
        //User has no projects
        var results = [];
        return callback(null, results);
    }
};

exports.getUserPostsUris = function (userUri, currentPage, callback) {
    var index = currentPage === 1 ? 0 : (currentPage * 5) - 5;
    var maxResults = 5;
    Project.findByCreatorOrContributor(userUri, function (err, projects) {
        if (!err) {
            async.mapSeries(projects, function (project, cb1) {
                cb1(null, project.uri);
            }, function (err, fullProjectsUris) {
                getAllPosts(fullProjectsUris, function (err, results) {
                    if (!err) {
                        callback(err, results);
                    }
                    else {
                        console.error("Error getting a user post");
                        console.error(err);
                        callback(err, results)
                    }
                }, index, maxResults);
            })
        }
        else {
            console.error("Error finding user projects");
            console.error(projects);
            callback(err, projects)
        }
    });
};

const getNumLikesForAPost = function (postID, cb) {

    const query =
        "SELECT ?likeURI ?userURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked ?userURI . \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : postID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                cb(null, results);
            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

const numPostsDatabaseAux = function (projectUrisArray, callback) {
    /*WITH <http://127.0.0.1:3001/social_dendro>
     SELECT (COUNT(DISTINCT ?postURI) AS ?count)
     WHERE {
     ?postURI rdf:type ddr:Post.
     }*/
    if (projectUrisArray && projectUrisArray.length > 0) {
        async.mapSeries(projectUrisArray, function (uri, cb1) {
            cb1(null, '<' + uri + '>');
        }, function (err, fullProjectsUris) {
            const projectsUris = fullProjectsUris.join(" ");
            const query =
                "WITH [0] \n" +
                "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                /*"VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost" + " ddr:FileSystemPost" + " ddr:ManualPost" +
                "} \n" +*/
                //"?uri rdf:type ?postTypes. \n" +
                "?uri rdf:type ddr:Post. \n" +
                "?uri ddr:projectUri ?project. \n" +
                "} \n ";

            db.connection.executeViaJDBC(query,
                DbConnection.pushLimitsArguments([
                    {
                        type : Elements.types.resourceNoEscape,
                        value: db_social.graphUri
                    }
                ]),
                function (err, results) {
                    if (isNull(err)) {
                        return callback(err, results[0].count);
                    }
                    else {
                        return callback(true, "Error fetching numPosts in numPostsDatabaseAux");
                    }
                });
        });
    }
    else
    {
        //User has no projects
        var results = 0;
        return callback(null, results);
    }
};

const userLikedAPost = function (postID, userUri, cb) {
    const self = this;

    const query =
        "SELECT ?likeURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : postID
            },
            {
                type : Elements.types.resource,
                value : userUri
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                if (results.length > 0)
                    cb(err, true);
                else
                    cb(err, false);
            }
            else {
                cb(true, "Error checking if a post is liked by a user");
            }
        });
};

const removeOrAddLike = function (postID, userUri, cb) {
    const self = this;

    const query =
        "SELECT ?likeURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : postID
            },
            {
                type : Elements.types.resource,
                value : userUri
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                let likeExists = false;
                if (results.length > 0) {
                    removeLike(results[0].likeURI, userUri, function (err, data) {
                        likeExists = true;
                        cb(err, likeExists);
                    });
                }
                else
                    cb(err, likeExists);
            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

const getCommentsForAPost = function (postID, cb) {
    const self = this;

    const query =
        "SELECT ?commentURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?commentURI rdf:type ddr:Comment. \n" +
        "?commentURI ddr:postURI [1]. \n" +
        "?commentURI ddr:modified ?date. \n " +
        "} \n" +
        "ORDER BY ASC(?date) \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : postID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                async.mapSeries(results, function (commentUri, callback) {
                    Comment.findByUri(commentUri.commentURI, function (err, comment) {
                        callback(null, comment);
                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, comments) {
                    cb(null, comments);
                });
            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

exports.getPosts_controller = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUser = req.user;
        var postsQueryInfo = req.query.postsQueryInfo;

        getSharesOrPostsInfo(postsQueryInfo, function (err, postInfo) {
            if (isNull(err)) {
                if (isNull(postInfo) || postInfo.length === 0) {
                    var errorMsg = "Post uris not found";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else {
                    res.json(postInfo);
                }
            }
            else {
                res.status(500).json({
                    result: "Error",
                    message: "Error getting a post. " + JSON.stringify(postInfo)
                });
            }
        });
    }
    else {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

const getSharesForAPost = function (postID, cb) {
    const self = this;

    const query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:postURI [1]. \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: postID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                async.mapSeries(results, function (shareObject, callback) {
                    Share.findByUri(shareObject.shareURI, function (err, share) {
                        return callback(null, share);
                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, shares) {
                    cb(null, shares);
                });
            }
            else {
                cb(true, "Error shares for a post");
            }
        });
};


exports.numPostsDatabase = function (req, res) {
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        var currentUserUri = req.user.uri;
        Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
            if (isNull(err)) {
                async.mapSeries(projects, function (project, cb1) {
                    cb1(null, project.uri);
                }, function (err, projectsUris) {
                    if (isNull(err)) {
                        numPostsDatabaseAux(projectsUris, function (err, count) {
                            if (isNull(err)) {
                                res.json(count);
                            }
                            else {
                                res.status(500).json({
                                    result: "Error",
                                    message: "Error counting posts. " + JSON.stringify(err)
                                });
                            }
                        });
                    }
                    else {
                        console.error("Error iterating over projects URIs");
                        console.log(err);
                        res.status(500).json({
                            result: "Error",
                            message: "Error counting posts. " + JSON.stringify(err)
                        });
                    }
                })
            }
            else {
                res.status(500).json({
                    result: "Error",
                    message: "Error finding user projects"
                });
            }
        });
    }
    else {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

const removeLike = function (likeID, userUri, cb) {
    const self = this;

    const query =
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

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: likeID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                let likeExists = false;
                if (results.length > 0) {
                    likeExists = true;
                }
                cb(err, likeExists);
            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

exports.all = function (req, res) {
    const currentUser = req.user;
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');
    const currentPage = req.query.currentPage;
    const index = currentPage === 1 ? 0 : (currentPage * 5) - 5;
    const maxResults = 5;

    //TODO receber filters aqui para os posts da timeline de acordo com (order by numLikes, project, all my projects, etc)

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        Project.findByCreatorOrContributor(currentUser.uri, function (err, projects) {
            if (isNull(err)) {
                async.mapSeries(projects, function (project, cb1) {
                    cb1(null, project.uri);
                }, function (err, fullProjectsUris) {
                    getAllPosts(fullProjectsUris, function (err, results) {
                        if (isNull(err)) {
                            res.json(results);
                        }
                        else {
                            res.status(500).json({
                                result: "Error",
                                message: "Error getting posts. " + JSON.stringify(err)
                            });
                        }
                    }, index, maxResults);
                })
            }
            else {
                res.status(500).json({
                    result: "Error",
                    message: "Error finding user projects"
                });
            }
        });
    }
    else {
        let msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.new = function(req, res){
    let currentUserUri = req.user.uri;
    /*if (req.body.newPostContent !== null && req.body.newPostTitle !== null && req.body.newPostProjectUri !== null) {*/
    if (!isNull(req.body.newPostContent) && !isNull(req.body.newPostTitle) && !isNull(req.body.newPostProjectUri)) {
        Project.findByUri(req.body.newPostProjectUri, function (err, project) {
            if (!err && project) {
                project.isUserACreatorOrContributor(currentUserUri, function (err, isCreatorOrContributor) {
                    if (!err) {
                        if (isCreatorOrContributor) {
                            //is a creator or contributor
                            let postInfo = {
                                title: req.body.newPostTitle,
                                body: req.body.newPostContent
                            };

                            ManualPost.buildManualPost(currentUserUri, project, postInfo, function (err, manualPost) {
                                if (!err && manualPost !== null) {
                                    manualPost.save(function (err, result) {
                                        if (!err) {
                                            res.status(200).json({
                                                result: "OK",
                                                message: "Manual Post " + manualPost.uri + " successfully created"
                                            });
                                        }
                                        else {
                                            let errorMsg = "[Error] When saving a new manual post" + JSON.stringify(result);
                                            console.error(errorMsg);
                                            res.status(500).json({
                                                result: "Error",
                                                message: errorMsg
                                            });
                                        }
                                    }, false, null, null, null, null, db_social.graphUri);
                                }
                                else {
                                    let errorMsg = "[Error] When creating a new manual post" + JSON.stringify(manualPost);
                                    console.error(errorMsg);
                                    res.status(500).json({
                                        result: "Error",
                                        message: errorMsg
                                    });
                                }
                            });
                        }
                        else {
                            //is not a creator or contributor -> reject post creation
                            let errorMsg = "You are not creator or contributor of this Project";
                            res.status(401).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }
                    else {
                        let errorMsg = "[Error] When checking if a user is a contributor or creator of a project: " + JSON.stringify(isCreatorOrContributor);
                        res.status(500).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                });
            }
            else {
                let errorMsg = "[Error]: This project does not exist: " + JSON.stringify(project);
                console.error(errorMsg);
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db.graphUri, false, null, null);
    }
    else {
        let errorMsg = "Error saving post. The request body is missing a parameter(REQUIRED 'newPostContent'; 'newPostTitle', 'newPostProjectUri')";
        console.error(errorMsg);
        res.status(400).json({
            result: "Error",
            message: errorMsg
        });
    }
};

exports.getPost_controller = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postURI = req.query.postID;

        Post.findByUri(postURI, function (err, post) {
            if (isNull(err)) {

                if (!post) {
                    const errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else {
                    res.json(post);
                }
            }
            else {
                res.status(500).json({
                    result: "Error",
                    message: "Error getting a post. " + JSON.stringify(post)
                });
            }
        }, null, db_social.graphUri, false, null, null);
    }
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.share = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const shareMsg = req.body.shareMsg;
        const postUri = req.body.postID;

        if(isNull(shareMsg))
        {
            const errorMsg = "Missing required body parameter 'shareMsg'";
            res.status(400).json({
                result: "Error",
                message: errorMsg
            });
        }
        else
        {
            Post.findByUri(postUri, function (err, post) {
                if (isNull(err)) {
                    if (!post) {
                        const errorMsg = "Invalid post uri";
                        res.status(404).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                    else {
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

                        let newShareData = {
                            ddr: {
                                userWhoShared: currentUser.uri,
                                postURI: post.uri,
                                shareMsg: shareMsg,
                                projectUri: post.ddr.projectUri
                            },
                            dcterms: {
                                creator: currentUser.uri
                            },
                            rdf: {
                                isShare: true
                            }
                        };

                        Share.buildFromInfo(newShareData, function (err, newShare) {
                            let newNotification = new Notification({
                                ddr: {
                                    userWhoActed: currentUser.uri,
                                    resourceTargetUri: post.uri,
                                    actionType: "Share",
                                    resourceAuthorUri: post.dcterms.creator,
                                    shareURI: newShare.uri
                                },
                                foaf: {
                                    status: "unread"
                                }
                            });

                            newShare.save(function (err, resultShare) {
                                if (isNull(err)) {
                                    /*
                                     res.json({
                                     result : "OK",
                                     message : "Post shared successfully"
                                     });*/
                                    newNotification.save(function (error, resultNotification) {
                                        if (isNull(error)) {
                                            res.json({
                                                result: "OK",
                                                message: "Post shared successfully"
                                            });
                                        }
                                        else {
                                            res.status(500).json({
                                                result: "Error",
                                                message: "Error saving a notification for a Share " + JSON.stringify(resultNotification)
                                            });
                                        }
                                    }, false, null, null, null, null, db_notifications.graphUri);
                                }
                                else {
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
                else {
                    res.status(500).json({
                        result: "Error",
                        message: "Error sharing a post. " + JSON.stringify(post)
                    });
                }
            }, null, db_social.graphUri, null);
        }
    }
    else {
        var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.getPostComments = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postUri = req.query.postID;

        Post.findByUri(postUri, function (err, post) {
            if (isNull(err) && post != null) {
                getCommentsForAPost(postUri, function (err, comments) {
                    if (!isNull(err)) {
                        res.status(500).json({
                            result: "Error",
                            message: "Error getting comments from a post " + JSON.stringify(comments)
                        });
                    }
                    else {
                        res.json(comments);
                    }
                });
            }
            else {
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.comment = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const commentMsg = req.body.commentMsg;

        if(isNull(commentMsg))
        {
            const errorMsg = "Missing required body parameter 'commentMsg'";
            res.status(400).json({
                result: "Error",
                message: errorMsg
            });
        }
        else
        {
            Post.findByUri(req.body.postID, function (err, post) {
                if (isNull(err) && !isNull(post)) {
                    let newComment = new Comment({
                        ddr: {
                            userWhoCommented: currentUser.uri,
                            postURI: post.uri,
                            commentMsg: commentMsg
                        }
                    });

                    let newNotification = new Notification({
                        ddr: {
                            userWhoActed: currentUser.uri,
                            resourceTargetUri: post.uri,
                            actionType: "Comment",
                            resourceAuthorUri: post.dcterms.creator
                        },
                        foaf: {
                            status: "unread"
                        }
                    });

                    newComment.save(function (err, resultComment) {
                        if (isNull(err)) {
                            /*
                             res.json({
                             result : "OK",
                             message : "Post commented successfully"
                             });*/
                            newNotification.save(function (error, resultNotification) {
                                if (isNull(error)) {
                                    res.json({
                                        result: "OK",
                                        message: "Post commented successfully"
                                    });
                                }
                                else {
                                    res.status(500).json({
                                        result: "Error",
                                        message: "Error saving a notification for a Comment " + JSON.stringify(resultNotification)
                                    });
                                }
                            }, false, null, null, null, null, db_notifications.graphUri);
                        }
                        else {
                            res.status(500).json({
                                result: "Error",
                                message: "Error Commenting a post. " + JSON.stringify(resultComment)
                            });
                        }

                    }, false, null, null, null, null, db_social.graphUri);
                }
                else {
                    const errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
            }, null, db_social.graphUri, null);
        }
    }
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
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

exports.like = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        removeOrAddLike(req.body.postID, currentUser.uri, function (err, likeExists) {
            if (isNull(err)) {
                if (likeExists) {
                    //like was removed
                    res.json({
                        result: "OK",
                        message: "Like was removed"
                    });
                }
                else {
                    Post.findByUri(req.body.postID, function (err, post) {
                        if (isNull(err) && !isNull(post)) {
                            let newLike = new Like({
                                ddr: {
                                    userWhoLiked: currentUser.uri,
                                    postURI: post.uri
                                }
                            });

                            //resourceTargetUri -> a post etc
                            //resourceAuthorUri -> the author of the post etc
                            //userWhoActed -> user who commmented/etc
                            //actionType -> comment/like/share
                            //status-> read/unread

                            let newNotification = new Notification({
                                ddr: {
                                    userWhoActed: currentUser.uri,
                                    resourceTargetUri: post.uri,
                                    actionType: "Like",
                                    resourceAuthorUri: post.dcterms.creator
                                },
                                foaf: {
                                    status: "unread"
                                }
                            });

                            newLike.save(function (err, resultLike) {
                                if (isNull(err)) {
                                    newNotification.save(function (error, resultNotification) {
                                        if (isNull(error)) {
                                            res.json({
                                                result: "OK",
                                                message: "Post liked successfully"
                                            });
                                        }
                                        else {
                                            res.status(500).json({
                                                result: "Error",
                                                message: "Error saving a notification for a Like " + JSON.stringify(resultNotification)
                                            });
                                        }
                                    }, false, null, null, null, null, db_notifications.graphUri);
                                }
                                else {
                                    res.status(500).json({
                                        result: "Error",
                                        message: "Error Liking a post. " + JSON.stringify(resultLike)
                                    });
                                }

                            }, false, null, null, null, null, db_social.graphUri);
                        }
                        else {
                            const errorMsg = "Invalid post uri";
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
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
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

exports.getPostShares = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postUri = req.query.postID;

        Post.findByUri(postUri, function (err, post) {
            if (isNull(err) && !isNull(post)) {
                getSharesForAPost(postUri, function (err, shares) {
                    if (!isNull(err)) {
                        res.status(500).json({
                            result: "Error",
                            message: "Error getting shares from a post " + JSON.stringify(shares)
                        });
                    }
                    else {
                        res.json(shares);
                    }
                });
            }
            else {
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.postLikesInfo = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        /*const postURI = req.body.postURI;*/
        const postURI = req.query.postURI;
        let resultInfo;

        Post.findByUri(postURI, function (err, post) {
            if (isNull(err) && !isNull(post)) {
                getNumLikesForAPost(post.uri, function (err, likesArray) {
                    if (isNull(err)) {
                        if (likesArray.length) {
                            resultInfo = {
                                postURI: postURI,
                                numLikes: likesArray.length,
                                usersWhoLiked: _.pluck(likesArray, 'userURI')
                            };
                        }
                        else {
                            resultInfo = {
                                postURI: postURI, numLikes: 0, usersWhoLiked: []
                            };
                        }
                        res.json(resultInfo);
                    }
                    else {
                        res.status(500).json({
                            result: "Error",
                            message: "Error getting likesInfo from a post " + JSON.stringify(err)
                        });
                    }

                });
            }
            else {
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

//Gets a specific post
exports.post = function (req, res) {
    const acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');
    const currentUser = req.user;
    //const postUri = "http://" + Config.host + req.url;
    const postUri = req.url;

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

    Post.findByUri(postUri, function (err, post) {
        if (isNull(err) && !isNull(post)) {
            if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                async.series([
                        function (callback) {
                            getCommentsForAPost(post, function (err, commentsData) {
                                post.commentsContent = commentsData;
                                callback(err);
                            });
                        },
                        function (callback) {
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
                            if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost")) {
                                MetadataChangePost.findByUri(post.uri, function (err, metadataChangePost) {
                                    if (isNull(err)) {
                                        getChangesFromMetadataChangePost(metadataChangePost, function (err, changesInfo) {
                                            //[editChanges, addChanges, deleteChanges]
                                            if(isNull(err))
                                            {
                                                post.changesInfo = changesInfo;
                                                callback(null, null)
                                            }
                                            else
                                            {
                                                callback(err, changesInfo);
                                            }
                                        });
                                    }
                                    else {
                                        console.error("Error getting a metadataChangePost");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost")) {
                                FileSystemPost.findByUri(post.uri, function (err, fileSystemPost) {
                                    if (isNull(err)) {
                                        getResourceInfoFromFileSystemPost(fileSystemPost, function (err, resourceInfo) {
                                            post.resourceInfo = resourceInfo;
                                            callback(err);
                                        });
                                    }
                                    else {
                                        console.error("Error getting a File System Post");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else {
                                callback(null);
                            }
                        }
                    ],
                    function (err, results) {
                        res.json(post);
                    });
            }
            else {
                res.render('social/showPost',
                    {
                        postUri: postUri
                    }
                );
            }
        }
        else {
            if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else {
                flash('error', "Unable to retrieve the post : " + postUri);
                res.render('index',
                    {
                        error_messages: ["Post " + postUri + " not found."]
                    });
            }
        }
    }, null, db_social.graphUri, false, null, null);
};

//Gets a specific share
exports.getShare = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    const currentUser = req.user;
    //const shareUri = "http://" + req.headers.host + req.url;
    const shareUri = req.url;

    Share.findByUri(shareUri, function (err, share) {
        if (isNull(err) && !isNull(share)) {
            if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {

                async.parallel([
                        function (callback) {
                            getCommentsForAPost(share.uri, function (err, commentsData) {
                                callback(err, commentsData);
                            });
                        },
                        function (callback) {
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
                    function (err, results) {
                        share.commentsContent = results[0];
                        share.likesContent = results[1];
                        share.sharesContent = results[2];
                        res.json(share);
                    });
            }
            else {
                res.render('social/showShare',
                    {
                        shareUri: shareUri,
                        postUri: share.ddr.postURI
                    }
                );
            }
        }
        else {
            if (acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
            {
                var errorMsg = "Invalid share uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else {
                flash('error', "Unable to retrieve the share : " + shareUri);
                res.render('index',
                    {
                        error_messages: ["Share " + shareUri + " not found."]
                    });
            }
        }
    }, null, db_social.graphUri, null);
};

var getLikesForAPost = function (postUri, callback) {
    let resultInfo;
    Post.findByUri(postUri, function (err, post) {
        if (isNull(err) && !isNull(post)) {
            getNumLikesForAPost(post.uri, function (err, likesArray) {
                if (isNull(err)) {
                    if (likesArray.length) {
                        resultInfo = {
                            postURI: post.uri,
                            numLikes: likesArray.length,
                            usersWhoLiked: _.pluck(likesArray, 'userURI')
                        };
                    }
                    else {
                        resultInfo = {
                            postURI: post.uri, numLikes: 0, usersWhoLiked: []
                        };
                    }
                    callback(null, resultInfo);
                }
                else {
                    console.error("Error getting likesInfo from a post");
                    console.error(err);
                    callback(true, "Error getting likesInfo from a post");
                }

            });
        }
        else {
            const errorMsg = "Invalid post uri";
            console.error(err);
            console.error(errorMsg);
        }
    }, null, db_social.graphUri, null);
};

//for processing various posts
var getSharesOrPostsInfo = function (postsQueryInfo, cb) {
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

    let postsInfo = {};

    async.mapSeries(postsQueryInfo, function (postQueryInfo, callback) {
        Post.findByUri(postQueryInfo.uri, function (err, post) {
            if (!err && post != null) {
                async.series([
                        function (callback) {
                            getCommentsForAPost(post, function (err, commentsData) {
                                post.commentsContent = commentsData;
                                callback(err);
                            });
                        },
                        function (callback) {
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
                            if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost")) {
                                MetadataChangePost.findByUri(post.uri, function (err, metadataChangePost) {
                                    if (!err) {
                                        getChangesFromMetadataChangePost(metadataChangePost, function (err, changesInfo) {
                                            //[editChanges, addChanges, deleteChanges]
                                            /*post.changesInfo = changesInfo;
                                            callback(err);*/
                                            if(isNull(err))
                                            {
                                                post.changesInfo = changesInfo;
                                                callback(null, null)
                                            }
                                            else
                                            {
                                                // typeof "foo" === "string"
                                                /*if(typeof changesInfo === "string" && changesInfo === "Resource at getChangesFromMetadataChangePost resource does not exist")
                                                {
                                                    post = null;
                                                    delete post;
                                                    callback(null, null);
                                                }
                                                else
                                                {
                                                    callback(err, changesInfo);
                                                }*/
                                                callback(err, changesInfo);
                                            }
                                        });
                                    }
                                    else {
                                        console.error("Error getting a metadataChangePost");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost")) {
                                FileSystemPost.findByUri(post.uri, function (err, fileSystemPost) {
                                    if (isNull(err)) {
                                        getResourceInfoFromFileSystemPost(fileSystemPost, function (err, resourceInfo) {
                                            post.resourceInfo = resourceInfo;
                                            callback(err);
                                        });
                                    }
                                    else {
                                        console.error("Error getting a File System Post");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/Share")) {
                                Share.findByUri(post.uri, function (err, share) {
                                    if (!err) {
                                        //Gets the info from the original post that was shared
                                        getSharesOrPostsInfo([{uri: share.ddr.postURI}], function (err, originalPostInfo) {
                                            if(err || isNull(originalPostInfo))
                                            {
                                                console.error("Error getting the original shared post");
                                                console.error(err);
                                                callback(err);
                                            }
                                            else
                                            {
                                                postsInfo[share.ddr.postURI] = originalPostInfo[share.ddr.postURI];
                                                callback(err);
                                            }
                                        });
                                    }
                                    else {
                                        console.error("Error getting a share Post");
                                        console.error(err);
                                        callback(err);
                                    }
                                }, null, db_social.graphUri, false, null, null);
                            }
                            else {
                                callback(null);
                            }
                        }
                    ],
                    function (err, results) {
                        if (isNull(err)) {
                            postsInfo[postQueryInfo.uri] = post;
                            callback(err, results);
                        }
                        else {
                            if(results.toString().includes("Resource at getChangesFromMetadataChangePost resource does not exist"))
                            {
                                postsInfo[postQueryInfo.uri] = post;
                                callback(null, null);
                            }
                            else
                            {
                                callback(err, results);
                            }
                        }
                    });
            }
            else {
                var errorMsg = "Invalid post uri";
                callback(true, errorMsg);
            }
        }, null, db_social.graphUri, false, null, null);
    }, function (err, results) {
        cb(err, postsInfo);
    });
};