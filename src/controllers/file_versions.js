var Post = require('../models/social/post.js').Post;
var Like = require('../models/social/like.js').Like;
var Comment = require('../models/social/comment.js').Comment;
var Share = require('../models/social/share.js').Share;
var Ontology = require('../models/meta/ontology.js').Ontology;
var Project = require('../models/project.js').Project;
var FileVersion = require('../models/versions/file_versions.js').FileVersions;
var Notification = require('../models/notifications/notification.js').Notification;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var db_notification = function () { return GLOBAL.db.notification;}();

//NELSON
var app = require('../app');

var numFileVersionsDatabaseAux = function (projectUrisArray, callback) {
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
                projectsUris+
                "}\n" +
                "?uri rdf:type ddr:FileVersions. \n" +
                "?uri ddr:projectUri ?project. \n"+
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
                        var msg = "Error fetching number of fileVersions in graph";
                        callback(true, msg);
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

exports.numFileVersionsInDatabase = function (req, res) {
    var currentUserUri = req.session.user.uri;

    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
        if(!err)
        {
            async.map(projects, function (project, cb1) {
                cb1(null, project.uri);
            }, function (err, fullProjectsUris) {
                numFileVersionsDatabaseAux(fullProjectsUris, function (err, count) {
                    if(!err)
                    {
                        res.json(count);
                    }
                    else{
                        res.status(500).json({
                            result : "Error",
                            message : "Error counting FileVersions. " + JSON.stringify(err)
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

    /*
    numFileVersionsDatabaseAux(function (err, count) {
        if(!err)
        {
            res.json(count);
        }
        else{
            res.status(500).json({
                result : "Error",
                message : "Error counting FileVersions. " + JSON.stringify(err)
            });
        }
    });*/
};

var getProjectFileVersions = function (projectUrisArray, startingResultPosition, maxResults, callback) {
    var self = this;

    if(projectUrisArray && projectUrisArray.length > 0)
    {
        async.map(projectUrisArray, function (uri, cb1) {
            cb1(null, '<'+uri+ '>');
        }, function (err, fullProjectsUris) {
            var projectsUris = fullProjectsUris.join(" ");
            var query =
                "WITH [0] \n" +
                "SELECT DISTINCT ?fileVersion \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris + "\n" +
                "}. \n" +
                //"?fileVersion nie:contentLastModified ?date. \n" +
                //"{?fileVersion nie:contentLastModified ?date} UNION {?fileVersion dcterms:modified ?date} \n" +
                "?fileVersion dcterms:modified ?date. \n" +
                "?fileVersion rdf:type ddr:FileVersions. \n" +
                "?fileVersion ddr:projectUri ?project. \n" +
                "} \n "+
                "ORDER BY DESC(?date) \n";


            /*
             var query =
             "WITH [0] \n" +
             "SELECT DISTINCT ?fileVersion \n" +
             "WHERE { \n" +
             "{?fileVersion nie:contentLastModified ?date} UNION {?fileVersion dcterms:modified ?date} \n" +
             "?fileVersion rdf:type ddr:FileVersions. \n" +
             "} \n "+
             "ORDER BY DESC(?date) \n";*/

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
                        var msg = "Error fetching FileVersions";
                        callback(true, msg);
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

exports.all = function (req, res) {
    //TODO
        //get all user projects
        //query to get all fileVersions for with a specific project uri
        //order query by data
        //paginate results

    var currentUserUri = req.session.user.uri;
    var currentPage = req.query.currentPage;
    var index = currentPage == 1? 0 : (currentPage*5) - 5;
    var maxResults = 5;
    
    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
       if(!err)
       {
           async.map(projects, function (project, cb1) {
               cb1(null, project.uri);
           }, function (err, projectsUris) {
               getProjectFileVersions(projectsUris, index, maxResults, function (err, fileVersions) {
                   if(!err)
                   {
                       res.json(fileVersions);
                   }
                   else
                   {
                       res.status(500).json({
                           result : "Error",
                           message : "Error getting posts. " + JSON.stringify(err)
                       });
                   }
               });
           });
       }
    });
};

exports.getFileVersion = function (req, res) {
    var currentUser = req.session.user;
    var fileVersionUri = req.body.fileVersionUri;

    FileVersion.findByUri(fileVersionUri, function (err, fileVersion) {
        if(!err)
        {
            res.json(fileVersion);
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting a File version. " + JSON.stringify(fileVersion)
            });
        }
    },null, db_social.graphUri);
};


exports.fileVersionLikesInfo = function (req, res) {
    var currentUser = req.session.user;
    var fileVersionUri = req.body.fileVersionUri;
    var resultInfo;

    getNumLikesForAFileVersion(fileVersionUri, function (err, likesArray) {
        if(!err)
        {
            if(likesArray.length)
            {
                resultInfo = {
                    fileVersionUri: fileVersionUri, numLikes : likesArray.length, usersWhoLiked : _.pluck(likesArray, 'userURI')
                };
            }
            else
            {
                resultInfo = {
                    fileVersionUri: fileVersionUri, numLikes : 0, usersWhoLiked : 'undefined'
                };
            }
            res.json(resultInfo);
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting likesInfo from a fileVersion " + JSON.stringify(err)
            });
        }

    });
};

var getNumLikesForAFileVersion = function(fileVersionUri, cb)
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
                value : fileVersionUri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                cb(false, results);
            }
            else
            {
                cb(true, "Error fetching number of likes for a fileVersion");
            }
        });
};

exports.like = function (req, res) {
    var fileVersionUri = req.body.fileVersionUri;
    var currentUser = req.session.user;

    removeOrAdLikeFileVersion(fileVersionUri, currentUser.uri, function (err, likeExists) {
        if(!err)
        {
            if(likeExists)
            {
                //like was removed
                res.json({
                    result : "OK",
                    message : "FileVersion already liked"
                });
            }
            else
            {
                FileVersion.findByUri(fileVersionUri, function(err, fileVersion)
                {
                    var newLike = new Like({
                        ddr: {
                            userWhoLiked : currentUser.uri,
                            postURI: fileVersion.uri
                        }
                    });

                    var newNotification = new Notification({
                        ddr: {
                            userWhoActed : currentUser.uri,
                            resourceTargetUri: fileVersion.uri,
                            actionType: "Like",
                            resourceAuthorUri: fileVersion.ddr.creatorUri
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
                                        message : "FileVersion liked successfully"
                                    });
                                }
                                else
                                {
                                    res.status(500).json({
                                        result: "Error",
                                        message: "Error saving a notification for a Like " + JSON.stringify(resultNotification)
                                    });
                                }
                            }, false, null, null, null, null, db_notification.graphUri);
                        }
                        else
                        {
                            res.status(500).json({
                                result: "Error",
                                message: "Error Liking a FileVersion. " + JSON.stringify(resultLike)
                            });
                        }

                    }, false, null, null, null, null, db_social.graphUri);
                }, null, db_social.graphUri);
            }
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error Liking a FileVersion. "
            });
        }
    });
};

var removeLikeInFileVersion = function (likeUri, currentUserUri, cb) {
    var self = this;

    var query =
        "WITH [0] \n" +
        "DELETE {[1] ?p ?v}\n" +
        "WHERE { \n" +
        "[1] ?p ?v \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : likeUri
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
                cb(true, "Error Liking a fileVersion");
            }
        });
};

var removeOrAdLikeFileVersion = function (fileVersionUri, currentUserUri, cb) {
    var self = this;

    var query =
        "SELECT ?likeURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        //"?likeURI ddr:postURI ?postID \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +//TODO this could be wrong
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
                value : fileVersionUri
            },
            {
                type : DbConnection.resource,
                value : currentUserUri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                var likeExists = false;
                if(results.length > 0)
                {
                    removeLikeInFileVersion(results[0].likeURI, currentUserUri, function (err, data) {
                        likeExists = true;
                        cb(err, likeExists);
                    });
                }
                else
                    cb(err, likeExists);
            }
            else
            {
                cb(true, "Error Liking FileVersion");
            }
        });
};

exports.comment = function (req, res) {
    var currentUser = req.session.user;
    var fileVersionUri = req.body.fileVersionUri;
    var commentMsg = req.body.commentMsg;
    FileVersion.findByUri(fileVersionUri, function(err, fileVersion)
    {
        var newComment = new Comment({
            ddr: {
                userWhoCommented : currentUser.uri,
                postURI: fileVersion.uri,
                commentMsg: commentMsg
            }
        });

        var newNotification = new Notification({
            ddr: {
                userWhoActed : currentUser.uri,
                resourceTargetUri: fileVersion.uri,
                actionType: "Comment",
                resourceAuthorUri: fileVersion.ddr.creatorUri
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
                newNotification.save(function (error, resultNotification) {
                    if(!error)
                    {
                        res.json({
                            result : "OK",
                            message : "FileVersion commented successfully"
                        });
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error saving a notification for a Comment " + JSON.stringify(resultNotification)
                        });
                    }
                }, false, null, null, null, null, db_notification.graphUri);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error Commenting a FileVersion. " + JSON.stringify(resultComment)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri);
};

exports.share = function (req, res) {
    var currentUser = req.session.user;
    var fileVersionUri = req.body.fileVersionUri;
    var shareMsg = req.body.shareMsg;
    FileVersion.findByUri(fileVersionUri, function(err, fileVersion)
    {
        var newShare = new Share({
            ddr: {
                userWhoShared : currentUser.uri,
                fileVersionUri: fileVersion.uri,
                shareMsg: shareMsg,
                projectUri: fileVersion.ddr.projectUri,
                creatorUri: currentUser.uri
            },
            rdf: {
                isShare : true
            }
        });

        var newNotification = new Notification({
            ddr: {
                userWhoActed : currentUser.uri,
                resourceTargetUri: fileVersion.uri,
                actionType: "Share",
                resourceAuthorUri: fileVersion.ddr.creatorUri
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
                newNotification.save(function (error, resultNotification) {
                    if(!error)
                    {
                        res.json({
                            result : "OK",
                            message : "FileVersion shared successfully"
                        });
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error saving a notification for a Share " + JSON.stringify(resultNotification)
                        });
                    }
                }, false, null, null, null, null, db_notification.graphUri);
            }
            else
            {
                res.status(500).json({
                    result: "Error",
                    message: "Error sharing a fileVersion. " + JSON.stringify(resultShare)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri);
};

exports.getFileVersionShares = function (req, res) {
    var currentUser = req.session.user;
    var fileVersionUri = req.body.fileVersionUri;


    getSharesForAFileVersion(fileVersionUri, function (err, shares) {
        if(err)
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting shares from a FileVersion " + JSON.stringify(shares)
            });
        }
        else
        {
            res.json(shares);
        }
    });

};

var getSharesForAFileVersion = function (fileVersionUri, cb) {
    var self = this;

    var query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:fileVersionUri [1]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resource,
                value : fileVersionUri
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
                cb(true, "Error shares for a FileVersion");
            }
        });
};