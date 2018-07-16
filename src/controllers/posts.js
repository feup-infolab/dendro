const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Post = require("../models/social/post.js").Post;
const Like = require("../models/social/like.js").Like;
const Notification = require("../models/notifications/notification.js").Notification;
const Comment = require("../models/social/comment.js").Comment;
const Share = require("../models/social/share.js").Share;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
const Event = require(Pathfinder.absPathInSrcFolder("/models/event.js")).Event;
const PostObj = require(Pathfinder.absPathInSrcFolder("/models/post.js")).Post;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const Project = require("../models/project.js").Project;
const DbConnection = require("../kb/db.js").DbConnection;
const MetadataChangePost = require("../models/social/metadataChangePost").MetadataChangePost;
const ManualPost = require("../models/social/manualPost").ManualPost;
const FileSystemPost = require("../models/social/fileSystemPost").FileSystemPost;
const _ = require("underscore");

const flash = require("connect-flash");

const async = require("async");
const db = Config.getDBByID();
const db_social = Config.getDBByID("social");
const db_notifications = Config.getDBByID("notifications");

const dbMySQL = require(Pathfinder.absPathInSrcFolder("mysql_models"));

const app = require("../app");

const addPostsToTimeline = function (posts, nextPosition, timelineId, callback)
{
    let insertArray = [];
    let itemsProcessed = 0;
    const insertInTimeline = function (posts, nextPosition)
    {
        return dbMySQL.timeline_post.bulkCreate(posts).then(function ()
        {
            return dbMySQL.timeline.update({ nextPosition: nextPosition }, { where: { id: timelineId } }).then(function ()
            {
                return callback();
            }).catch(function (err)
            {
                console.log(err);
            });
        });
        /* return dbMySQL.sequelize.transaction(function (t)
        {
            return dbMySQL.timeline_post.bulkCreate(posts, {transaction: t}).then(function ()
            {
                return dbMySQL.timeline.update({ nextPosition: nextPosition }, { where: { id: timelineId } }, {transaction: t});
            });
        }).then(function ()
        {
            return callback();
        }).catch(function (err)
        {
            console.log(err);
        }); */
    };
    const createInsertArray = function (post, index, array)
    {
        insertArray.push({timelineId: timelineId, postURI: post.uri, position: nextPosition, fixedPosition: nextPosition});
        nextPosition++;
        itemsProcessed++;
        if (itemsProcessed === array.length)
        {
            return insertInTimeline(insertArray, nextPosition);
        }
    };
    posts.forEach(createInsertArray);
};

const getPostsPerPage = function (startingResultPosition, maxResults, timelineId, callback)
{
    return dbMySQL.timeline_post.findAll({
        raw: true,
        where: { timelineId: timelineId },
        attributes: [ ["postURI", "uri"], "position", "fixedPosition" ],
        order: [ ["fixedPosition", "DESC"] ],
        offset: startingResultPosition,
        limit: maxResults
    }).then(function (posts)
    {
        console.log(posts);
        return callback(null, posts);
    });
};

/**
 * Gets all the posts ordered by modified date and using pagination
 * @param callback the function callback
 * @param startingResultPosition the starting position to start the query
 * @param maxResults the limit for the query
 */
const getAllPosts = function (projectUrisArray, callback, nextPosition, lastAccess, startingResultPosition, maxResults, timelineId)
{
    // based on getRecentProjectWideChangesSocial
    const self = this;

    if (projectUrisArray && projectUrisArray.length > 0)
    {
        async.mapSeries(projectUrisArray, function (uri, cb1)
        {
            // cb1(null, "<" + uri + ">");
            cb1(null, "'" + uri + "'");
        }, function (err, fullProjects)
        {
            /* const projectsUris = fullProjects.join(" ");
            let query =
                "WITH [0] \n" +
                // "SELECT DISTINCT ?uri ?postTypes\n" +
                "SELECT DISTINCT ?uri\n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                /!* "VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost" + " ddr:FileSystemPost" + " ddr:ManualPost" +
                "} \n" + *!/
                "?uri ddr:modified ?date. \n" +
                // "?uri rdf:type ?postTypes. \n" +
                "?uri rdf:type ddr:Post. \n" +
                "?uri ddr:projectUri ?project. \n" +
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
                    return callback(true, "Error fetching posts in getAllPosts");
                }); */

            let projectsUris = fullProjects.join(",");
            let queryEngagement = "SELECT postURI AS uri FROM " + Config.mySQLDBName + ".posts WHERE projectURI IN (" + projectsUris + ") AND createdAt >= :date ORDER BY createdAt ASC;";
            let lastDate;
            if (!isNull(lastAccess))
            {
                lastDate = lastAccess.toISOString();
            }
            else
            {
                lastDate = "1989-03-21T00:00:00.000Z";
            }
            dbMySQL.sequelize
                .query(queryEngagement,
                    {replacements: { date: lastDate }, type: dbMySQL.sequelize.QueryTypes.SELECT})
                .then(posts =>
                {
                    // let newPosts = Object.keys(posts).map(function (k) { return posts[k]; });
                    console.log(posts);
                    if (posts.length > 0)
                    {
                        return addPostsToTimeline(posts, nextPosition, timelineId, function ()
                        {
                            return getPostsPerPage(startingResultPosition, maxResults, timelineId, callback);
                        });
                    }
                    // else
                    return getPostsPerPage(startingResultPosition, maxResults, timelineId, callback);
                })
                .catch(err =>
                {
                    console.log(err);
                    return callback(true, "Error fetching posts in getAllPosts");
                });
        });
    }
    else
    {
        // User has no projects
        const results = [];
        return callback(null, results);
    }
};

const getRankedPosts = function (projectUrisArray, callback, userUri, nextPosition, lastAccess, startingResultPosition, maxResults, timelineId)
{
    const getTimeScore = function (created, now)
    {
        let diff = now - created;
        if (diff === 0)
        {
            return 1;
        }
        // else
        return (1 / diff);
    };
    const getMaximumNumbers = function (posts, interactions, now)
    {
        let maxs = {likes: -1, comments: -1, shares: -1, interactions: -1, time: -1};
        maxs.likes = Math.max.apply(Math, posts.map(function (post)
        {
            return post.likes;
        }));
        maxs.likes = maxs.likes === 0 ? 1 : maxs.likes;
        maxs.comments = Math.max.apply(Math, posts.map(function (post)
        {
            return post.comments;
        }));
        maxs.comments = maxs.comments === 0 ? 1 : maxs.comments;
        maxs.shares = Math.max.apply(Math, posts.map(function (post)
        {
            return post.shares;
        }));
        maxs.shares = maxs.shares === 0 ? 1 : maxs.shares;
        maxs.interactions = Math.max.apply(Math, interactions.map(function (project)
        {
            return project.interactions;
        }));
        maxs.interactions = maxs.interactions === 0 ? 1 : maxs.interactions;
        maxs.time = Math.max.apply(Math, posts.map(function (post)
        {
            return getTimeScore(post.created, now);
        }));
        maxs.time = maxs.time === 0 ? 1 : maxs.time;
        return maxs;
    };
    const getPostScore = function (projectInteractionsArray, post, maxs, now)
    {
        const getProjectInteractions = function (array, projectURI)
        {
            let project = array.find(function (element)
            {
                return element.projectURI === projectURI;
            });
            if (isNull(project))
            {
                return 0;
            }
            return project.interactions;
        };
        let likes = post.likes / maxs.likes;
        let comments = post.comments / maxs.comments;
        let shares = post.shares / maxs.shares;
        let projectInteractions = getProjectInteractions(projectInteractionsArray, post.projectURI) / maxs.interactions;
        // let postType = post.postType;
        let timeScore = getTimeScore(post.created, now) / maxs.time;
        return shares * 0.35 + comments * 0.25 + projectInteractions * 0.2 + likes * 0.1 + timeScore * 0.1;
    };
    if (projectUrisArray && projectUrisArray.length > 0)
    {
        async.mapSeries(projectUrisArray, function (uri, cb1)
        {
            cb1(null, "'" + uri + "'");
        }, function (err, fullProjects)
        {
            let projectsUris = fullProjects.join(",");
            let queryEngagement = "call " + Config.mySQLDBName + ".countEngagementAndInteractions(:user, :projects, :lastAccess);";
            let lastDate;
            if (!isNull(lastAccess))
            {
                lastDate = lastAccess.toISOString();
            }
            else
            {
                lastDate = "1989-03-21T00:00:00.000Z";
            }
            dbMySQL.sequelize
                .query(queryEngagement,
                    {replacements: { user: "'" + userUri + "'", projects: projectsUris, lastAccess: "'" + lastDate + "'" }, type: dbMySQL.sequelize.QueryTypes.SELECT})
                .spread((posts, interactions) =>
                {
                    let newPosts = Object.keys(posts).map(function (k)
                    {
                        return posts[k];
                    });
                    let interactionsArray = Object.keys(interactions).map(function (k)
                    {
                        return interactions[k];
                    });
                    let now = new Date();
                    let maxs = getMaximumNumbers(newPosts, interactionsArray, now);
                    newPosts.sort(function (post1, post2)
                    {
                        post1.score = getPostScore(interactionsArray, post1, maxs, now);
                        post2.score = getPostScore(interactionsArray, post2, maxs, now);
                        let diff = post1.score - post2.score;
                        if (diff === 0)
                        {
                            return post1.created - post2.created;
                        }
                        return diff;
                    });
                    console.log(newPosts);
                    if (newPosts.length > 0)
                    {
                        return addPostsToTimeline(newPosts, nextPosition, timelineId, function ()
                        {
                            return getPostsPerPage(startingResultPosition, maxResults, timelineId, callback);
                        });
                    }
                    // else
                    return getPostsPerPage(startingResultPosition, maxResults, timelineId, callback);
                })
                .catch(err =>
                {
                    console.log(err);
                    return callback(true, "Error fetching posts in getRankedPosts");
                });
        });
    }
    else
    {
        // User has no projects
        const results = [];
        return callback(null, results);
    }
};

exports.getUserPostsUris = function (userUri, currentPage, useRank, nextPosition, lastAccess, timelineId, callback)
{
    const maxResults = 30;
    const index = currentPage === 1 ? 0 : (currentPage * maxResults) - maxResults;
    const cb = function (err, results)
    {
        if (!err)
        {
            callback(err, results);
        }
        else
        {
            Logger.log("error", "Error getting a user post");
            Logger.log("error", err);
            callback(err, results);
        }
    };
    Project.findByCreatorOrContributor(userUri, function (err, projects)
    {
        if (!err)
        {
            async.mapSeries(projects, function (project, cb1)
            {
                cb1(null, project.uri);
            }, function (err, fullProjectsUris)
            {
                if (!useRank)
                {
                    getAllPosts(fullProjectsUris, cb, nextPosition, lastAccess, index, maxResults, timelineId);
                }
                else
                {
                    getRankedPosts(fullProjectsUris, cb, userUri, nextPosition, lastAccess, index, maxResults, timelineId);
                }
            });
        }
        else
        {
            Logger.log("error", "Error finding user projects");
            Logger.log("error", projects);
            callback(err, projects);
        }
    });
};

const getNumLikesForAPost = function (postID, cb)
{
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
                type: Elements.ontologies.ddr.postURI.type,
                value: postID
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                cb(null, results);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

const numPostsDatabaseAux = function (projectUrisArray, callback)
{
    /* WITH <http://127.0.0.1:3001/social_dendro>
     SELECT (COUNT(DISTINCT ?postURI) AS ?count)
     WHERE {
     ?postURI rdf:type ddr:Post.
     } */
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
                "} \n" +
                /* "VALUES ?postTypes { \n" +
                "ddr:Post" + " ddr:Share" + " ddr:MetadataChangePost" + " ddr:FileSystemPost" + " ddr:ManualPost" +
                "} \n" + */
                // "?uri rdf:type ?postTypes. \n" +
                "?uri rdf:type ddr:Post. \n" +
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
                    return callback(true, "Error fetching numPosts in numPostsDatabaseAux");
                });
        });
    }
    else
    {
    // User has no projects
        const results = 0;
        return callback(null, results);
    }
};

const userLikedAPost = function (postID, userUri, cb)
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
                type: Elements.ontologies.ddr.postURI.type,
                value: postID
            },
            {
                type: Elements.ontologies.ddr.userWhoLiked.type,
                value: userUri
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                if (results.length > 0)
                {
                    cb(err, true);
                }
                else
                {
                    cb(err, false);
                }
            }
            else
            {
                cb(true, "Error checking if a post is liked by a user");
            }
        });
};

const removeOrAddLike = function (postID, userUri, cb)
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
                type: Elements.ontologies.ddr.postURI.type,
                value: postID
            },
            {
                type: Elements.ontologies.ddr.userWhoLiked.type,
                value: userUri
            }
        ]),
        function (err, results)
        {
            const removeLike = function (likeID, userUri, cb)
            {
                const query =
                    "WITH [0] \n" +
                    // "DELETE {?likeURI ?p ?v}\n" +
                    "DELETE {[1] ?p ?v}\n" +
                    // "FROM [0] \n" +
                    "WHERE { \n" +
                    "[1] ?p ?v \n" +
                    // "?likeURI ddr:postURI ?postID \n" +
                    // "?likeURI rdf:type ddr:Like. \n" +
                    // "?likeURI ddr:postURI [1]. \n" +
                    // "?likeURI ddr:userWhoLiked [2]. \n" +
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
                    function (err, results)
                    {
                        if (isNull(err))
                        {
                            let likeExists = false;
                            if (results.length > 0)
                            {
                                likeExists = true;
                            }
                            cb(err, likeExists);
                        }
                        else
                        {
                            cb(true, "Error fetching children of project root folder");
                        }
                    });
            };

            if (isNull(err))
            {
                let likeExists = false;
                if (results.length > 0)
                {
                    removeLike(results[0].likeURI, userUri, function (err, data)
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
                cb(true, "Error fetching children of project root folder");
            }
        });
};

const getCommentsForAPost = function (postID, cb)
{
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
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.ontologies.ddr.postURI.type,
                value: postID
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                async.mapSeries(results, function (commentUri, callback)
                {
                    Comment.findByUri(commentUri.commentURI, function (err, comment)
                    {
                        callback(null, comment);
                        // }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, comments)
                {
                    cb(null, comments);
                });
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

exports.getPosts_controller = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postsQueryInfo = req.query.postsQueryInfo;

        // for processing various posts
        const getSharesOrPostsInfo = function (postsQueryInfo, cb)
        {
            const getCommentsForAPost = function (post, cb)
            {
                post.getComments(function (err, commentsData)
                {
                    cb(err, commentsData);
                });
            };

            const getLikesForAPost = function (post, cb)
            {
                post.getLikes(function (err, likesData)
                {
                    cb(err, likesData);
                });
            };

            const getSharesForAPost = function (post, cb)
            {
                post.getShares(function (err, sharesData)
                {
                    cb(err, sharesData);
                });
            };

            const getChangesFromMetadataChangePost = function (metadataChangePost, cb)
            {
                metadataChangePost.getChangesFromMetadataChangePost(function (err, changesData)
                {
                    cb(err, changesData);
                });
            };

            const getResourceInfoFromFileSystemPost = function (fileSystemPost, cb)
            {
                fileSystemPost.getResourceInfo(function (err, resourceInfo)
                {
                    cb(err, resourceInfo);
                });
            };

            let postsInfo = {};

            async.mapSeries(postsQueryInfo, function (postQueryInfo, callback)
            {
                Post.findByUri(postQueryInfo.uri, function (err, post)
                {
                    post.fixedPosition = postQueryInfo.fixedPosition;
                    if (isNull(err) && !isNull(post))
                    {
                        async.series([
                            function (callback)
                            {
                                getCommentsForAPost(post, function (err, commentsData)
                                {
                                    post.commentsContent = commentsData;
                                    callback(err);
                                });
                            },
                            function (callback)
                            {
                                getLikesForAPost(post, function (err, likesData)
                                {
                                    post.likesContent = likesData;
                                    callback(err);
                                });
                            },
                            function (callback)
                            {
                                getSharesForAPost(post, function (err, sharesData)
                                {
                                    post.sharesContent = sharesData;
                                    callback(err);
                                });
                            },
                            function (callback)
                            {
                                // TODO HOW TO ACCESS THE FULL TYPE
                                if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost"))
                                {
                                    MetadataChangePost.findByUri(post.uri, function (err, metadataChangePost)
                                    {
                                        if (!err)
                                        {
                                            getChangesFromMetadataChangePost(metadataChangePost, function (err, changesInfo)
                                            {
                                                // [editChanges, addChanges, deleteChanges]
                                                /* post.changesInfo = changesInfo;
                                                    callback(err); */
                                                if (isNull(err))
                                                {
                                                    post.changesInfo = changesInfo;
                                                    callback(null, null);
                                                }
                                                else
                                                {
                                                    // typeof "foo" === "string"
                                                    /* if(typeof changesInfo === "string" && changesInfo === "Resource at getChangesFromMetadataChangePost resource does not exist")
                                                        {
                                                            post = null;
                                                            delete post;
                                                            callback(null, null);
                                                        }
                                                        else
                                                        {
                                                            callback(err, changesInfo);
                                                        } */
                                                    callback(err, changesInfo);
                                                }
                                            });
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error getting a metadataChangePost");
                                            Logger.log("error", err);
                                            callback(err);
                                        }
                                    }, null, db_social.graphUri, false, null, null);
                                }
                                else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost"))
                                {
                                    FileSystemPost.findByUri(post.uri, function (err, fileSystemPost)
                                    {
                                        if (isNull(err))
                                        {
                                            getResourceInfoFromFileSystemPost(fileSystemPost, function (err, resourceInfo)
                                            {
                                                post.resourceInfo = resourceInfo;
                                                callback(err);
                                            });
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error getting a File System Post");
                                            Logger.log("error", err);
                                            callback(err);
                                        }
                                    }, null, db_social.graphUri, false, null, null);
                                }
                                else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/Share"))
                                {
                                    Share.findByUri(post.uri, function (err, share)
                                    {
                                        if (!err)
                                        {
                                            // Gets the info from the original post that was shared
                                            getSharesOrPostsInfo([{uri: share.ddr.postURI}], function (err, originalPostInfo)
                                            {
                                                if (err || isNull(originalPostInfo))
                                                {
                                                    Logger.log("error", "Error getting the original shared post");
                                                    Logger.log("error", err);
                                                    callback(err);
                                                }
                                                else
                                                {
                                                    postsInfo[share.ddr.postURI] = originalPostInfo[share.ddr.postURI];
                                                    callback(err);
                                                }
                                            });
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error getting a share Post");
                                            Logger.log("error", err);
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
                        function (err, results)
                        {
                            if (isNull(err))
                            {
                                postsInfo[postQueryInfo.uri] = post;
                                callback(err, results);
                            }
                            else
                            {
                                if (results.toString().includes("Resource at getChangesFromMetadataChangePost resource does not exist"))
                                {
                                    postsInfo[postQueryInfo.uri] = post;
                                    callback(null, null);
                                }
                                else
                                {
                                    callback(err, results[res]);
                                }
                            }
                        });
                    }
                    else
                    {
                        let errorMsg = isNull(post) ? "Invalid post uri: " + postQueryInfo.uri : "Error at getSharesOrPostsInfo: " + JSON.stringify(post);
                        callback(true, errorMsg);
                    }
                }, null, db_social.graphUri, false, null, null);
            }, function (err, results)
            {
                if (isNull(err))
                {
                    cb(err, postsInfo);
                }
                else
                {
                    // results.pop() returns the last element of the results array and also removes it.
                    // in this case it is the error message, as async.mapSeries runs the functions above one at a time for each postUri
                    // if one fails, it gets here instantly without running the functions for the remaining postUris
                    // so the last element in the results array is the error message of the postUri that failed
                    let errorMessage = results.pop();
                    cb(err, errorMessage);
                }
            });
        };

        getSharesOrPostsInfo(postsQueryInfo, function (err, postInfo)
        {
            if (isNull(err))
            {
                if (isNull(postInfo) || postInfo.length === 0)
                {
                    const errorMsg = "Post uris not found";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else
                {
                    res.json(postInfo);
                }
            }
            else
            {
                if (!(typeof postInfo === "string" || postInfo instanceof String))
                {
                    postInfo = JSON.stringify(postInfo);
                }
                res.status(500).json({
                    result: "Error",
                    message: "Error getting a post. " + postInfo
                });
            }
        });
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

const getSharesForAPost = function (postID, cb)
{
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
                type: Elements.ontologies.ddr.postURI.type,
                value: postID
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
                        return callback(null, share);
                        // }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, shares)
                {
                    cb(null, shares);
                });
            }
            else
            {
                cb(true, "Error shares for a post");
            }
        });
};

exports.numPostsDatabase = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUserUri = req.user.uri;
        Project.findByCreatorOrContributor(currentUserUri, function (err, projects)
        {
            if (isNull(err))
            {
                async.mapSeries(projects, function (project, cb1)
                {
                    cb1(null, project.uri);
                }, function (err, projectsUris)
                {
                    if (isNull(err))
                    {
                        numPostsDatabaseAux(projectsUris, function (err, count)
                        {
                            if (isNull(err))
                            {
                                res.json(count);
                            }
                            else
                            {
                                res.status(500).json({
                                    result: "Error",
                                    message: "Error counting posts. " + JSON.stringify(err)
                                });
                            }
                        });
                    }
                    else
                    {
                        Logger.log("error", "Error iterating over projects URIs");
                        Logger.log(err);
                        res.status(500).json({
                            result: "Error",
                            message: "Error counting posts. " + JSON.stringify(err)
                        });
                    }
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
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.all = function (req, res)
{
    const currentUser = req.user;
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    const currentPage = parseInt(req.query.currentPage);
    const useRank = parseInt(req.query.useRank);
    const maxResults = 30;
    const index = currentPage === 1 ? 0 : (currentPage * maxResults) - maxResults;

    const cb = function (err, results)
    {
        if (isNull(err))
        {
            res.json(results);
        }
        else
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting posts. " + JSON.stringify(err)
            });
        }
    };

    // TODO receber filters aqui para os posts da timeline de acordo com (order by numLikes, project, all my projects, etc)
    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        Project.findByCreatorOrContributor(currentUser.uri, function (err, projects)
        {
            if (isNull(err))
            {
                async.mapSeries(projects, function (project, cb1)
                {
                    cb1(null, project.uri);
                }, function (err, fullProjectsUris)
                {
                    let type = "";
                    if (useRank)
                    {
                        type = "ranked";
                    }
                    else
                    {
                        type = "unranked";
                    }
                    let newTimeline = {
                        userURI: req.userURI,
                        type: type
                    };
                    dbMySQL.timeline
                        .findOrCreate({where: {userURI: req.user.uri, type: type}, defaults: newTimeline})
                        .spread((timeline, created) =>
                        {
                            if (currentPage === 1)
                            {
                                if (!useRank)
                                {
                                    getAllPosts(fullProjectsUris, cb, timeline.nextPosition, timeline.lastAccess, index, maxResults, timeline.id);
                                }
                                else
                                {
                                    getRankedPosts(fullProjectsUris, cb, currentUser.uri, timeline.nextPosition, timeline.lastAccess, index, maxResults, timeline.id);
                                }
                                if (!created)
                                {
                                    var t = new Date();
                                    t.setSeconds(t.getSeconds() + 1);
                                    return timeline.update({
                                        lastAccess: t
                                    });
                                }
                            }
                            else
                            {
                                getRankedPostsPerPage(index, maxResults, timeline.id, cb);
                            }
                        }).catch(err =>
                        {
                            console.log(err);
                        });
                    /* dbMySQL.timeline
                        .findOne({where: {userURI: currentUser.uri, type: type}})
                        .then((timeline) => {
                            if (currentPage === 1)
                            {
                                if (!useRank)
                                {
                                    getAllPosts(fullProjectsUris, cb, timeline.nextPosition, timeline.lastAccess, index, maxResults, timeline.id);
                                }
                                else
                                {
                                    getRankedPosts(fullProjectsUris, cb, currentUser.uri, timeline.nextPosition, timeline.lastAccess, index, maxResults, timeline.id);
                                }
                                var t = new Date();
                                t.setSeconds(t.getSeconds() + 1);
                                return timeline.update({
                                    lastAccess: t
                                });
                            }
                            // else
                            getRankedPostsPerPage(index, maxResults, timeline.id, cb);
                        }).catch(err => {
                            console.log(err);
                        }); */
                    /* if (useRank === "false")
                    {
                        getAllPosts(fullProjectsUris, cb, index, maxResults);
                    }
                    else
                    {
                        if (currentPage === 1)
                        {
                            dbMySQL.timeline
                                .findOne({where: {userURI: currentUser.uri}, raw: true})
                                .then((timeline) => {
                                    console.log(timeline);
                                    return getRankedPosts(fullProjectsUris, cb, currentUser.uri, timeline.nextPosition, timeline.lastAccess, index, maxResults);
                                }).catch(err => {
                                    console.log(err);
                                });
                        }
                        else
                        {
                            getRankedPostsPerPage(currentUser.uri, index, maxResults, cb);
                        }
                    } */
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
    }
    else
    {
        let msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.new = function (req, res)
{
    let currentUserUri = req.user.uri;
    /* if (req.body.newPostContent !== null && req.body.newPostTitle !== null && req.body.newPostProjectUri !== null) { */
    if (!isNull(req.body.newPostContent) && !isNull(req.body.newPostTitle) && !isNull(req.body.newPostProjectUri))
    {
        Project.findByUri(req.body.newPostProjectUri, function (err, project)
        {
            if (!err && project)
            {
                project.isUserACreatorOrContributor(currentUserUri, function (err, isCreatorOrContributor)
                {
                    if (!err)
                    {
                        if (isCreatorOrContributor)
                        {
                            // is a creator or contributor
                            let postInfo = {
                                title: req.body.newPostTitle,
                                body: req.body.newPostContent
                            };

                            ManualPost.buildManualPost(currentUserUri, project, postInfo, function (err, manualPost)
                            {
                                if (!err && manualPost !== null)
                                {
                                    manualPost.save(function (err, result)
                                    {
                                        if (!err)
                                        {
                                            let post = new PostObj("manual", manualPost.uri, currentUserUri, req.body.newPostProjectUri);
                                            post.saveToMySQL(function (err)
                                            {
                                                if (isNull(err))
                                                {
                                                    Logger.log("Post \"manual\" saved to MySQL");
                                                    let event = new Event("post", manualPost.uri, currentUserUri);
                                                    event.saveToMySQL(function (err)
                                                    {
                                                        if (isNull(err))
                                                        {
                                                            Logger.log("Event \"post\" saved to MySQL");
                                                            return res.status(200).json({
                                                                result: "OK",
                                                                message: "Manual Post " + manualPost.uri + " successfully created"
                                                            });
                                                        }

                                                        return Logger.log("error", err);
                                                    });
                                                }
                                                else
                                                {
                                                    Logger.log("error", err);
                                                }
                                            });
                                        }
                                        else
                                        {
                                            let errorMsg = "[Error] When saving a new manual post" + JSON.stringify(result);
                                            Logger.log("error", errorMsg);
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
                                    Logger.log("error", errorMsg);
                                    res.status(500).json({
                                        result: "Error",
                                        message: errorMsg
                                    });
                                }
                            });
                        }
                        else
                        {
                            // is not a creator or contributor -> reject post creation
                            let errorMsg = "You are not creator or contributor of this Project";
                            res.status(401).json({
                                result: "Error",
                                message: errorMsg
                            });
                        }
                    }
                    else
                    {
                        let errorMsg = "[Error] When checking if a user is a contributor or creator of a project: " + JSON.stringify(isCreatorOrContributor);
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
                Logger.log("error", errorMsg);
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
        Logger.log("error", errorMsg);
        res.status(400).json({
            result: "Error",
            message: errorMsg
        });
    }
};

exports.getPost_controller = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postURI = req.query.postID;

        Post.findByUri(postURI, function (err, post)
        {
            if (isNull(err))
            {
                if (!post)
                {
                    const errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else
                {
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
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.share = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const shareMsg = req.body.shareMsg;
        const postUri = req.body.postID;

        if (isNull(shareMsg))
        {
            const errorMsg = "Missing required body parameter 'shareMsg'";
            res.status(400).json({
                result: "Error",
                message: errorMsg
            });
        }
        else
        {
            Post.findByUri(postUri, function (err, post)
            {
                if (isNull(err))
                {
                    if (!post)
                    {
                        const errorMsg = "Invalid post uri";
                        res.status(404).json({
                            result: "Error",
                            message: errorMsg
                        });
                    }
                    else
                    {
                        /* const newShare = new Share({
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
                         }); */

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

                        Share.buildFromInfo(newShareData, function (err, newShare)
                        {
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

                            newShare.save(function (err, resultShare)
                            {
                                if (isNull(err))
                                {
                                    let newPost = new PostObj("share", newShare.uri, currentUser.uri, post.ddr.projectUri);
                                    newPost.saveToMySQL(function (err)
                                    {
                                        if (isNull(err))
                                        {
                                            Logger.log("Post \"share\" saved to MySQL");
                                            let event = new Event("share", newShare.uri, currentUser.uri);
                                            event.saveToMySQL(function (err)
                                            {
                                                if (isNull(err))
                                                {
                                                    Logger.log("Event \"share\" saved to MySQL");
                                                }
                                                else
                                                {
                                                    Logger.log("error", err);
                                                }
                                            });
                                        }
                                        else
                                        {
                                            Logger.log("error", err);
                                        }
                                    });
                                    /*
                                     res.json({
                                     result : "OK",
                                     message : "Post shared successfully"
                                     }); */
                                    newNotification.save(function (error, resultNotification)
                                    {
                                        if (isNull(error))
                                        {
                                            res.json({
                                                result: "OK",
                                                message: "Post shared successfully"
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
                                    Logger.log("error", "Error share a post");
                                    Logger.log("error", err);
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
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.getPostComments = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postUri = req.query.postID;

        Post.findByUri(postUri, function (err, post)
        {
            if (isNull(err) && post != null)
            {
                getCommentsForAPost(postUri, function (err, comments)
                {
                    if (!isNull(err))
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
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.comment = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const commentMsg = req.body.commentMsg;

        if (isNull(commentMsg))
        {
            const errorMsg = "Missing required body parameter 'commentMsg'";
            res.status(400).json({
                result: "Error",
                message: errorMsg
            });
        }
        else
        {
            Post.findByUri(req.body.postID, function (err, post)
            {
                if (isNull(err) && !isNull(post))
                {
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

                    newComment.save(function (err, resultComment)
                    {
                        if (isNull(err))
                        {
                            let event = new Event("comment", post.uri, currentUser.uri);
                            event.saveToMySQL(function (err)
                            {
                                if (isNull(err))
                                {
                                    Logger.log("Event \"comment\" saved to MySQL");
                                }
                                else
                                {
                                    Logger.log("error", err);
                                }
                            });
                            let postObj = new PostObj(null, post.uri, null, null);
                            postObj.updateTimestamp(function (err)
                            {
                                if (isNull(err))
                                {
                                    Logger.log("Updated post timestamp upon new comment.");
                                }
                                else
                                {
                                    Logger.log("error", err);
                                }
                            });
                            /*
                             res.json({
                             result : "OK",
                             message : "Post commented successfully"
                             }); */
                            newNotification.save(function (error, resultNotification)
                            {
                                if (isNull(error))
                                {
                                    res.json({
                                        result: "OK",
                                        message: "Post commented successfully"
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
                    const errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
            }, null, db_social.graphUri, null);
        }
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }

    /* Post.findByUri(req.body.postID, function(err, post)
     {
     const newComment = new Comment({
     ddr: {
     userWhoCommented : currentUser.uri,
     postURI: post.uri,
     commentMsg: commentMsg
     }
     });
     const newNotification = new Notification({
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
     }, null, db_social.graphUri, null); */
};

exports.like = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        removeOrAddLike(req.body.postID, currentUser.uri, function (err, likeExists)
        {
            if (isNull(err))
            {
                if (likeExists)
                {
                    // like was removed
                    let event = new Event("like", req.body.postID, currentUser.uri, "");
                    event.deleteFromMySQL(function (err)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Event \"like\" deleted from MySQL");
                        }
                        else
                        {
                            Logger.log("error", err);
                        }
                    });
                    res.json({
                        result: "OK",
                        message: "Like was removed"
                    });
                }
                else
                {
                    Post.findByUri(req.body.postID, function (err, post)
                    {
                        if (isNull(err) && !isNull(post))
                        {
                            let newLike = new Like({
                                ddr: {
                                    userWhoLiked: currentUser.uri,
                                    postURI: post.uri
                                }
                            });

                            // resourceTargetUri -> a post etc
                            // resourceAuthorUri -> the author of the post etc
                            // userWhoActed -> user who commmented/etc
                            // actionType -> comment/like/share
                            // status-> read/unread

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

                            newLike.save(function (err, resultLike)
                            {
                                if (isNull(err))
                                {
                                    let event = new Event("like", post.uri, currentUser.uri);
                                    event.saveToMySQL(function (err)
                                    {
                                        if (isNull(err))
                                        {
                                            Logger.log("Event \"like\" saved to MySQL");
                                        }
                                        else
                                        {
                                            Logger.log("error", err);
                                        }
                                    });
                                    newNotification.save(function (error, resultNotification)
                                    {
                                        if (isNull(error))
                                        {
                                            res.json({
                                                result: "OK",
                                                message: "Post liked successfully"
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
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

/* const updateResource = function(currentResource, newResource, graphUri, cb)
{
    const descriptors = newResource.getDescriptors();

    db.connection.replaceDescriptorsOfSubject(
        currentResource.uri,
        descriptors,
        graphUri,
        function(err, result)
        {
            cb(err, result);
        }
    );
}; */

exports.getPostShares = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postUri = req.query.postID;

        Post.findByUri(postUri, function (err, post)
        {
            if (isNull(err) && !isNull(post))
            {
                getSharesForAPost(postUri, function (err, shares)
                {
                    if (!isNull(err))
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
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

exports.postLikesInfo = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        const currentUser = req.user;
        /* const postURI = req.body.postURI; */
        const postURI = req.query.postURI;
        let resultInfo;

        Post.findByUri(postURI, function (err, post)
        {
            if (isNull(err) && !isNull(post))
            {
                getNumLikesForAPost(post.uri, function (err, likesArray)
                {
                    if (isNull(err))
                    {
                        if (likesArray.length)
                        {
                            resultInfo = {
                                postURI: postURI,
                                numLikes: likesArray.length,
                                usersWhoLiked: _.pluck(likesArray, "userURI")
                            };
                        }
                        else
                        {
                            resultInfo = {
                                postURI: postURI, numLikes: 0, usersWhoLiked: []
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
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
        }, null, db_social.graphUri, null);
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash("error", "Invalid Request");
        res.status(400).json({
            result: "Error",
            message: msg
        });
    }
};

// Gets a specific post
exports.post = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    const currentUser = req.user;
    // const postUri = "http://" + Config.host + req.url;
    const postUri = req.url;

    const getCommentsForAPost = function (post, cb)
    {
        post.getComments(function (err, commentsData)
        {
            cb(err, commentsData);
        });
    };

    const getLikesForAPost = function (post, cb)
    {
        post.getLikes(function (err, likesData)
        {
            cb(err, likesData);
        });
    };

    const getSharesForAPost = function (post, cb)
    {
        post.getShares(function (err, sharesData)
        {
            cb(err, sharesData);
        });
    };

    const getChangesFromMetadataChangePost = function (metadataChangePost, cb)
    {
        metadataChangePost.getChangesFromMetadataChangePost(function (err, changesData)
        {
            cb(err, changesData);
        });
    };

    const getResourceInfoFromFileSystemPost = function (fileSystemPost, cb)
    {
        fileSystemPost.getResourceInfo(function (err, resourceInfo)
        {
            cb(err, resourceInfo);
        });
    };

    Post.findByUri(postUri, function (err, post)
    {
        if (isNull(err) && !isNull(post))
        {
            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                async.series([
                    function (callback)
                    {
                        getCommentsForAPost(post, function (err, commentsData)
                        {
                            post.commentsContent = commentsData;
                            callback(err);
                        });
                    },
                    function (callback)
                    {
                        getLikesForAPost(post, function (err, likesData)
                        {
                            post.likesContent = likesData;
                            callback(err);
                        });
                    },
                    function (callback)
                    {
                        getSharesForAPost(post, function (err, sharesData)
                        {
                            post.sharesContent = sharesData;
                            callback(err);
                        });
                    },
                    function (callback)
                    {
                        // TODO HOW TO ACCESS THE FULL TYPE
                        if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/MetadataChangePost"))
                        {
                            MetadataChangePost.findByUri(post.uri, function (err, metadataChangePost)
                            {
                                if (isNull(err))
                                {
                                    getChangesFromMetadataChangePost(metadataChangePost, function (err, changesInfo)
                                    {
                                        // [editChanges, addChanges, deleteChanges]
                                        if (isNull(err))
                                        {
                                            post.changesInfo = changesInfo;
                                            callback(null, null);
                                        }
                                        else
                                        {
                                            callback(err, changesInfo);
                                        }
                                    });
                                }
                                else
                                {
                                    Logger.log("error", "Error getting a metadataChangePost");
                                    Logger.log("error", err);
                                    callback(err);
                                }
                            }, null, db_social.graphUri, false, null, null);
                        }
                        else if (post.rdf.type.includes("http://dendro.fe.up.pt/ontology/0.1/FileSystemPost"))
                        {
                            FileSystemPost.findByUri(post.uri, function (err, fileSystemPost)
                            {
                                if (isNull(err))
                                {
                                    getResourceInfoFromFileSystemPost(fileSystemPost, function (err, resourceInfo)
                                    {
                                        post.resourceInfo = resourceInfo;
                                        callback(err);
                                    });
                                }
                                else
                                {
                                    Logger.log("error", "Error getting a File System Post");
                                    Logger.log("error", err);
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
                function (err, results)
                {
                    res.json(post);
                });
            }
            else
            {
                res.render("social/showPost",
                    {
                        postUri: postUri
                    }
                );
            }
        }
        else
        {
            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                const errorMsg = "Invalid post uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else
            {
                flash("error", "Unable to retrieve the post : " + postUri);
                res.render("index",
                    {
                        error_messages: ["Post " + postUri + " not found."]
                    });
            }
        }
    }, null, db_social.graphUri, false, null, null);
};

// Gets a specific share
exports.getShare = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");

    const currentUser = req.user;
    // const shareUri = "http://" + req.headers.host + req.url;
    const shareUri = req.url;

    Share.findByUri(shareUri, function (err, share)
    {
        if (isNull(err) && !isNull(share))
        {
            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                async.parallel([
                    function (callback)
                    {
                        getCommentsForAPost(share.uri, function (err, commentsData)
                        {
                            callback(err, commentsData);
                        });
                    },
                    function (callback)
                    {
                        const getLikesForAPost = function (postUri, callback)
                        {
                            let resultInfo;
                            Post.findByUri(postUri, function (err, post)
                            {
                                if (isNull(err) && !isNull(post))
                                {
                                    getNumLikesForAPost(post.uri, function (err, likesArray)
                                    {
                                        if (isNull(err))
                                        {
                                            if (likesArray.length)
                                            {
                                                resultInfo = {
                                                    postURI: post.uri,
                                                    numLikes: likesArray.length,
                                                    usersWhoLiked: _.pluck(likesArray, "userURI")
                                                };
                                            }
                                            else
                                            {
                                                resultInfo = {
                                                    postURI: post.uri, numLikes: 0, usersWhoLiked: []
                                                };
                                            }
                                            callback(null, resultInfo);
                                        }
                                        else
                                        {
                                            Logger.log("error", "Error getting likesInfo from a post");
                                            Logger.log("error", err);
                                            callback(true, "Error getting likesInfo from a post");
                                        }
                                    });
                                }
                                else
                                {
                                    const errorMsg = "Invalid post uri";
                                    Logger.log("error", err);
                                    Logger.log("error", errorMsg);
                                }
                            }, null, db_social.graphUri, null);
                        };

                        getLikesForAPost(share.uri, function (err, likesData)
                        {
                            callback(err, likesData);
                        });
                    },
                    function (callback)
                    {
                        getSharesForAPost(share.uri, function (err, sharesData)
                        {
                            callback(err, sharesData);
                        });
                    }
                ],
                    // optional callback
                function (err, results)
                {
                    share.commentsContent = results[0];
                    share.likesContent = results[1];
                    share.sharesContent = results[2];
                    res.json(share);
                });
            }
            else
            {
                res.render("social/showShare",
                    {
                        shareUri: shareUri,
                        postUri: share.ddr.postURI
                    }
                );
            }
        }
        else
        {
            if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
            {
                const errorMsg = "Invalid share uri";
                res.status(404).json({
                    result: "Error",
                    message: errorMsg
                });
            }
            else
            {
                flash("error", "Unable to retrieve the share : " + shareUri);
                res.render("index",
                    {
                        error_messages: ["Share " + shareUri + " not found."]
                    });
            }
        }
    }, null, db_social.graphUri, null);
};

exports.move = function (req, res)
{
    let acceptsHTML = req.accepts("html");
    const acceptsJSON = req.accepts("json");
    const currentUser = req.user;
    const useRank = parseInt(req.query.useRank);
    const postURI = req.query.postURI;
    const move = parseInt(req.query.move);
    const position = parseInt(req.query.position);

    if (acceptsJSON && !acceptsHTML) // will be null if the client does not accept html
    {
        let type = "";
        if (useRank)
        {
            type = "ranked";
        }
        else
        {
            type = "unranked";
        }
        dbMySQL.timeline
            .findOne({where: {userURI: currentUser.uri, type: type}})
            .then((timeline) =>
            {
                dbMySQL.timeline_post.update(
                    { fixedPosition: position },
                    { where: { fixedPosition: position + move, timelineId: timeline.id }
                    }).then(() =>
                {
                    dbMySQL.timeline_post.update(
                        { fixedPosition: position + move },
                        { where: { postURI: postURI, timelineId: timeline.id } }
                    ).then(() =>
                    {
                        res.json("success");
                    }).catch(err =>
                    {
                        console.log(err);
                        res.json("error");
                    });
                });
            }).catch(err =>
            {
                console.log(err);
            });
    }
};

