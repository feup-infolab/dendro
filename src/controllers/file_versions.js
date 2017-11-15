const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;

const Like = require("../models/social/like.js").Like;
const Comment = require("../models/social/comment.js").Comment;
const Share = require("../models/social/share.js").Share;
const Ontology = require("../models/meta/ontology.js").Ontology;
const Project = require("../models/project.js").Project;
const FileVersion = require("../models/versions/file_version.js").FileVersion;
const Notification = require("../models/notifications/notification.js").Notification;
const DbConnection = require("../kb/db.js").DbConnection;
const _ = require("underscore");

const async = require("async");
const db = Config.getDBByID();

const db_social = (function ()
{
    return Config.db.social;
}());

const db_notifications = (function ()
{
    return Config.db.notifications;
}());

const app = require("../app");

const getNumLikesForAFileVersion = function (fileVersionUri, cb)
{
    const self = this;

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
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: fileVersionUri
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                cb(false, results);
            }
            else
            {
                cb(true, "Error fetching number of likes for a fileVersion");
            }
        });
};

const removeOrAdLikeFileVersion = function (fileVersionUri, currentUserUri, cb)
{
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
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: fileVersionUri
            },
            {
                type: Elements.types.resource,
                value: currentUserUri
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                let likeExists = false;
                if (results.length > 0)
                {
                    const removeLikeInFileVersion = function (likeUri, currentUserUri, cb)
                    {
                        const query =
                            "WITH [0] \n" +
                            "DELETE {[1] ?p ?v}\n" +
                            "WHERE { \n" +
                            "[1] ?p ?v \n" +
                            "} \n";

                        db.connection.executeViaJDBC(query,
                            DbConnection.pushLimitsArguments([
                                {
                                    type: Elements.types.resourceNoEscape,
                                    value: db_social.graphUri
                                },
                                {
                                    type: Elements.types.resource,
                                    value: likeUri
                                }
                            ]),
                            function (err, results)
                            {
                                if (isNull(err))
                                {
                                    let likeExists = false;
                                    if (results.length > 0)
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

                    removeLikeInFileVersion(results[0].likeURI, currentUserUri, function (err, data)
                    {
                        likeExists = true;
                        cb(err, likeExists);
                    });
                }
                else
                {
                    cb(err, likeExists);
                }
            }
            else
            {
                cb(true, "Error Liking FileVersion");
            }
        });
};

const getSharesForAFileVersion = function (fileVersionUri, cb)
{
    const query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:fileVersionUri [1]. \n" +
        "} \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: fileVersionUri
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                async.mapSeries(results, function (shareObject, callback)
                {
                    Share.findByUri(shareObject.shareURI, function (err, share)
                    {
                        return callback(false, share);
                    }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                }, function (err, shares)
                {
                    cb(false, shares);
                });
            }
            else
            {
                cb(true, "Error shares for a FileVersion");
            }
        });
};

const numFileVersionsDatabaseAux = function (projectUrisArray, callback)
{
    if (projectUrisArray && projectUrisArray.length > 0)
    {
        async.mapSeries(projectUrisArray, function (uri, cb1)
        {
            cb1(null, "<" + uri + ">");
        }, function (err, fullProjectsUris)
        {
            const projectsUris = fullProjectsUris.join(" ");
            const query =
                "WITH [0] \n" +
                "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "}\n" +
                "{?uri rdf:type ddr:FileVersion. }\n" +
                "UNION \n" +
                "{?uri ddr:fileVersionUri ?x }\n" +
                "?uri ddr:projectUri ?project. \n" +
                "} \n ";

            db.connection.executeViaJDBC(query,
                DbConnection.pushLimitsArguments([
                    {
                        type: Elements.types.resourceNoEscape,
                        value: db_social.graphUri
                    }
                ]),
                function (err, results)
                {
                    if (isNull(err))
                    {
                        return callback(err, results[0].count);
                    }
                    const msg = "Error fetching number of fileVersions in graph";
                    return callback(true, msg);
                });
        });
    }
    else
    {
    // User has no projects
        var results = 0;
        return callback(null, results);
    }
};

exports.numFileVersionsInDatabase = function (req, res)
{
    const currentUserUri = req.user.uri;

    Project.findByCreatorOrContributor(currentUserUri, function (err, projects)
    {
        if (isNull(err))
        {
            async.mapSeries(projects, function (project, cb1)
            {
                cb1(null, project.uri);
            }, function (err, fullProjectsUris)
            {
                numFileVersionsDatabaseAux(fullProjectsUris, function (err, count)
                {
                    if (isNull(err))
                    {
                        res.json(count);
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error counting FileVersion. " + JSON.stringify(err)
                        });
                    }
                });
            });
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error finding user projects"
            });
        }
    });
};

const getProjectFileVersions = function (projectUrisArray, startingResultPosition, maxResults, callback)
{
    const self = this;

    if (projectUrisArray && projectUrisArray.length > 0)
    {
        async.mapSeries(projectUrisArray, function (uri, cb1)
        {
            cb1(null, "<" + uri + ">");
        }, function (err, fullProjectsUris)
        {
            const projectsUris = fullProjectsUris.join(" ");
            let query =
                "WITH [0] \n" +
                "SELECT DISTINCT ?fileVersion \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris + "\n" +
                "}. \n" +
                "?fileVersion ddr:modified ?date. \n" +
                "{?fileVersion rdf:type ddr:FileVersion. }\n" +
                "UNION \n" +
                "{?fileVersion ddr:fileVersionUri ?x }\n" +
                "?fileVersion ddr:projectUri ?project. \n" +
                "} \n " +
                "ORDER BY DESC(?date) \n";

            query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

            db.connection.executeViaJDBC(query,
                DbConnection.pushLimitsArguments([
                    {
                        type: Elements.types.resourceNoEscape,
                        value: db_social.graphUri
                    }
                ]),
                function (err, results)
                {
                    if (isNull(err))
                    {
                        return callback(err, results);
                    }
                    const msg = "Error fetching FileVersion";
                    return callback(true, msg);
                });
        });
    }
    else
    {
    // User has no projects
        var results = [];
        return callback(null, results);
    }
};

exports.all = function (req, res)
{
    const currentUserUri = req.user.uri;
    const currentPage = req.query.currentPage;
    const index = currentPage === 1 ? 0 : (currentPage * 5) - 5;
    const maxResults = 5;

    Project.findByCreatorOrContributor(currentUserUri, function (err, projects)
    {
        if (isNull(err))
        {
            async.mapSeries(projects, function (project, cb1)
            {
                cb1(null, project.uri);
            }, function (err, projectsUris)
            {
                getProjectFileVersions(projectsUris, index, maxResults, function (err, fileVersions)
                {
                    if (isNull(err))
                    {
                        res.json(fileVersions);
                    }
                    else
                    {
                        res.status(500).json({
                            result: "Error",
                            message: "Error getting posts. " + JSON.stringify(err)
                        });
                    }
                });
            });
        }
    });
};

exports.getFileVersion = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = req.body.fileVersionUri;

    FileVersion.findByUri(fileVersionUri, function (err, fileVersion)
    {
        if (isNull(err))
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
    }, null, db_social.graphUri);
};

exports.fileVersionLikesInfo = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = req.body.fileVersionUri;
    let resultInfo;

    getNumLikesForAFileVersion(fileVersionUri, function (err, likesArray)
    {
        if (isNull(err))
        {
            if (likesArray.length)
            {
                resultInfo = {
                    fileVersionUri: fileVersionUri, numLikes: likesArray.length, usersWhoLiked: _.pluck(likesArray, "userURI")
                };
            }
            else
            {
                resultInfo = {
                    fileVersionUri: fileVersionUri, numLikes: 0, usersWhoLiked: "undefined"
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

exports.like = function (req, res)
{
    const fileVersionUri = req.body.fileVersionUri;
    const currentUser = req.user;

    removeOrAdLikeFileVersion(fileVersionUri, currentUser.uri, function (err, likeExists)
    {
        if (isNull(err))
        {
            if (likeExists)
            {
                // like was removed
                res.json({
                    result: "OK",
                    message: "FileVersion already liked"
                });
            }
            else
            {
                FileVersion.findByUri(fileVersionUri, function (err, fileVersion)
                {
                    const newLike = new Like({
                        ddr: {
                            userWhoLiked: currentUser.uri,
                            postURI: fileVersion.uri
                        }
                    });

                    const newNotification = new Notification({
                        ddr: {
                            userWhoActed: currentUser.uri,
                            resourceTargetUri: fileVersion.uri,
                            actionType: "Like",
                            resourceAuthorUri: fileVersion.ddr.creatorUri
                        },
                        foaf: {
                            status: "unread"
                        }
                    });

                    newLike.save(function (err, resultLike)
                    {
                        if (isNull(err))
                        {
                            newNotification.save(function (error, resultNotification)
                            {
                                if (isNull(error))
                                {
                                    res.json({
                                        result: "OK",
                                        message: "FileVersion liked successfully"
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

exports.comment = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = req.body.fileVersionUri;
    const commentMsg = req.body.commentMsg;
    FileVersion.findByUri(fileVersionUri, function (err, fileVersion)
    {
        const newComment = new Comment({
            ddr: {
                userWhoCommented: currentUser.uri,
                postURI: fileVersion.uri,
                commentMsg: commentMsg
            }
        });

        const newNotification = new Notification({
            ddr: {
                userWhoActed: currentUser.uri,
                resourceTargetUri: fileVersion.uri,
                actionType: "Comment",
                resourceAuthorUri: fileVersion.ddr.creatorUri
            },
            foaf: {
                status: "unread"
            }
        });

        newComment.save(function (err, resultComment)
        {
            if (isNull(err))
            {
                newNotification.save(function (error, resultNotification)
                {
                    if (isNull(error))
                    {
                        res.json({
                            result: "OK",
                            message: "FileVersion commented successfully"
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
                    message: "Error Commenting a FileVersion. " + JSON.stringify(resultComment)
                });
            }
        }, false, null, null, null, null, db_social.graphUri);
    }, null, db_social.graphUri);
};

exports.share = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = req.body.fileVersionUri;
    const shareMsg = req.body.shareMsg;
    FileVersion.findByUri(fileVersionUri, function (err, fileVersion)
    {
        const newShare = new Share({
            ddr: {
                userWhoShared: currentUser.uri,
                fileVersionUri: fileVersion.uri,
                shareMsg: shareMsg,
                projectUri: fileVersion.ddr.projectUri,
                creatorUri: currentUser.uri
            },
            rdf: {
                isShare: true
            }
        });

        const newNotification = new Notification({
            ddr: {
                userWhoActed: currentUser.uri,
                resourceTargetUri: fileVersion.uri,
                actionType: "Share",
                resourceAuthorUri: fileVersion.ddr.creatorUri,
                shareURI: newShare.uri
            },
            foaf: {
                status: "unread"
            }
        });

        newShare.save(function (err, resultShare)
        {
            if (isNull(err))
            {
                newNotification.save(function (error, resultNotification)
                {
                    if (isNull(error))
                    {
                        res.json({
                            result: "OK",
                            message: "FileVersion shared successfully"
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
                res.status(500).json({
                    result: "Error",
                    message: "Error sharing a fileVersion. " + JSON.stringify(resultShare)
                });
            }
        }, false, null, null, null, null, db_social.graphUri);
    }, null, db_social.graphUri);
};

exports.getFileVersionShares = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = req.body.fileVersionUri;

    getSharesForAFileVersion(fileVersionUri, function (err, shares)
    {
        if (err)
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

exports.fileVersion = function (req, res)
{
    const currentUser = req.user;
    const fileVersionUri = "http://" + req.headers.host + req.url;
    res.render("social/showFileVersion",
        {
            fileVersionUri: fileVersionUri
        }
    );
};
