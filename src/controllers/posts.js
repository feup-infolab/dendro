const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const Post = require('../models/social/post.js').Post;
const Like = require('../models/social/like.js').Like;
const Notification = require('../models/notifications/notification.js').Notification;
const Comment = require('../models/social/comment.js').Comment;
const Share = require('../models/social/share.js').Share;
const Ontology = require('../models/meta/ontology.js').Ontology;
const Project = require('../models/project.js').Project;
const DbConnection = require("../kb/db.js").DbConnection;
const _ = require('underscore');

const async = require('async');
const db = Config.getDBByID();
const db_social = Config.getDBByID("social");
const db_notifications = Config.getDBByID("notifications");

const app = require('../app');

exports.numPostsDatabase = function (req, res) {
    const currentUserUri = req.user.uri;
    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
        if(isNull(err))
        {
            async.map(projects, function (project, cb1) {
                cb1(null, project.uri);
            }, function (err, projectsUris) {
                numPostsDatabaseAux(projectsUris,function (err, count) {
                    if(isNull(err))
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
    const currentUser = req.user;
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');
    const username = currentUser.uri;

    const pingForNewPosts = true;
    const currentPage = req.query.currentPage;
    const index = currentPage === 1 ? 0 : (currentPage * 5) - 5;
    const maxResults = 5;

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
                        if(isNull(err))
                        {
                            async.map(projects, function (project, cb1) {
                                cb1(null, project.uri);
                            }, function (err, fullProjectsUris) {
                                getAllPosts(fullProjectsUris,function (err, results) {
                                    if(isNull(err))
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
                        if(isNull(err))
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
                if (isNull(err))
                {
                    async.map(posts, function(post, callback){

                        Post.findByUri(post.uri, function (err, loadedPost) {
                            if(err)
                                return callback(err, null);
                            else
                            {
                                return callback(null, loadedPost);
                            }

                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri)
                        }, null, db_social.graphUri, null)
                    }, function(err, loadedPosts){
                        if(isNull(err))
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
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

function sortPostsByModifiedDate(postA, postB) {
    const a = new Date(postA.ddr.modified),
        b = new Date(postB.ddr.modified);
    return (a.getTime() - b.getTime());
}

//function that pings metadata changes from dendro_graph to build the posts in social_dendro graph
function pingNewPosts(sessionUser, cb) {
    const currentUserUri = sessionUser.uri;
    let numPostsCreated = 0;
    Project.findByCreatorOrContributor(currentUserUri, function(err, projects) {
        if(isNull(err))
        {
            if(projects.length > 0)
            {
                async.map(projects, function (project, cb1) {
                        const socialUpdatedAt = project.dcterms.socialUpdatedAt ? project.dcterms.socialUpdatedAt : '1970-09-21T19:27:46.578Z';
                        project.getRecentProjectWideChangesSocial(function(err, changes){
                            if(isNull(err))
                            {
                                if(changes.length > 0)
                                {
                                    async.map(changes, function(change, callback){
                                            if(change.changes && change.changes[0])// change.changes[0])
                                            {
                                                const newPost = new Post({
                                                    ddr: {
                                                        changeType: change.changes[0].ddr.changeType,
                                                        newValue: change.changes[0].ddr.newValue,
                                                        changedDescriptor: change.changes[0].ddr.changedDescriptor ? change.changes[0].ddr.changedDescriptor.label : 'undefined',
                                                        hasContent: change.changes[0].uri,
                                                        numLikes: 0,
                                                        projectUri: project.uri
                                                    },
                                                    dcterms: {
                                                        creator: currentUserUri,
                                                        title: project.dcterms.title
                                                    }
                                                });

                                                newPost.save(function(err, post)
                                                {
                                                    if (isNull(err))
                                                    {
                                                        numPostsCreated++;
                                                        return callback(err, post);
                                                    }
                                                    else
                                                    {
                                                        return callback(err, post);
                                                    }
                                                }, false, null, null, null, null, db_social.graphUri);
                                            }
                                            else
                                            {
                                                return callback(null,null);
                                            }
                                        },
                                        function(err, fullDescriptors)
                                        {
                                            if(isNull(err))
                                            {
                                                const updatedProject = project;
                                                updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                                                updateResource(project, updatedProject, db, function (error, data) {
                                                    cb1(error, fullDescriptors);
                                                });
                                            }
                                            else
                                            {
                                                const errorMsg = "Error at project changes";
                                                console.log(errorMsg);
                                                cb1(err, errorMsg);
                                            }
                                        });
                                }
                                else
                                {
                                    //no changes detected
                                    let updatedProject = project;
                                    updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                                    updateResource(project, updatedProject, db, function (error, data) {
                                        cb1(error,data);
                                    });
                                }
                            }
                            else
                            {
                                const errorMsg = "Error getting recent project wide social changes";
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
            const errorMsg = "Error finding projects by creator or contributor";
            return callback(err, errorMsg);
        }

    });

}

exports.new = function(req, res){
    /*
     var currentUser = req.user;

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
     if (isNull(err))
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
    const cenas = 'http://127.0.0.1:3001/posts/34240860-82bd-47c9-95fe-5b872451844d';
    getNumLikesForAPost(cenas, function (err, data) {
        /*
         res.json({
         result : "OK",
         message : "Post liked successfully"
         });*/
    });
};


exports.getPost_controller = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postURI = req.body.postID;

        const debugGraph = db_social.graphUri;
        Post.findByUri(req.body.postID, function(err, post)
        {
            if(isNull(err))
            {

                if(!post)
                {
                    const errorMsg = "Invalid post uri";
                    res.status(404).json({
                        result: "Error",
                        message: errorMsg
                    });
                }
                else
                {
                    //app.io.emit('chat message', post);
                    const eventMsg = 'postURI:' + postURI.uri;
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
        }, null, db_social.graphUri, null);
    }
    else
    {
        const msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing or is not the only Accept type";
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.share = function (req, res) {
    const currentUser = req.user;
    const shareMsg = req.body.shareMsg;
    Post.findByUri(req.body.postID, function(err, post)
    {
        const newShare = new Share({
            ddr: {
                userWhoShared: currentUser.uri,
                postURI: post.uri,
                shareMsg: shareMsg,
                projectUri: post.ddr.projectUri
            },
            dcterms: {
                creator: currentUser.uri
            }
        });

        const newNotification = new Notification({
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

        newShare.save(function(err, resultShare)
        {
            if(isNull(err))
            {
                /*
                res.json({
                    result : "OK",
                    message : "Post shared successfully"
                });*/
                newNotification.save(function (error, resultNotification) {
                    if(isNull(error))
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
                res.status(500).json({
                    result: "Error",
                    message: "Error sharing a post. " + JSON.stringify(resultShare)
                });
            }

        }, false, null, null, null, null, db_social.graphUri);

    }, null, db_social.graphUri, null);
};

exports.getPostComments = function (req, res) {
    const currentUser = req.user;
    const postUri = req.body.postID;
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
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const commentMsg = req.body.commentMsg;

        Post.findByUri(req.body.postID, function(err, post)
        {
            if(isNull(err) && !isNull(post))
            {
                const newComment = new Comment({
                    ddr: {
                        userWhoCommented: currentUser.uri,
                        postURI: post.uri,
                        commentMsg: commentMsg
                    }
                });

                const newNotification = new Notification({
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

                newComment.save(function(err, resultComment)
                {
                    if(isNull(err))
                    {
                        /*
                         res.json({
                         result : "OK",
                         message : "Post commented successfully"
                         });*/
                        newNotification.save(function (error, resultNotification) {
                            if(isNull(error))
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
            if(isNull(err))
            {
                /!*
                res.json({
                    result : "OK",
                    message : "Post commented successfully"
                });*!/
                newNotification.save(function (error, resultNotification) {
                    if(isNull(error))
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
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const postID = req.body.postID;
        const currentUser = req.user;

        Post.findByUri(postID, function(err, post)
        {
            if(isNull(err) && !isNull(post))
            {
                userLikedAPost(post.uri, currentUser.uri, function (err, isLiked) {
                    if(isNull(err))
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
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

exports.like = function (req, res) {
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        removeOrAdLike(req.body.postID, currentUser.uri, function (err, likeExists) {
            if(isNull(err))
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
                        if(isNull(err) && !isNull(post))
                        {
                            const updatedPost = post;
                            const newLike = new Like({
                                ddr: {
                                    userWhoLiked: currentUser.uri,
                                    postURI: post.uri
                                }
                            });

                            //resourceTargetUri -> a post, fileVersion etc
                            //resourceAuthorUri -> the author of the post etc
                            //userWhoActed -> user who commmented/etc
                            //actionType -> comment/like/share
                            //status-> read/unread

                            const newNotification = new Notification({
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

                            newLike.save(function(err, resultLike)
                            {
                                if(isNull(err))
                                {
                                    newNotification.save(function (error, resultNotification) {
                                        if(isNull(error))
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
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
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
            const projectsUris = fullProjectsUris.join(" ");
            const query =
                "WITH [0] \n" +
                "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
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
                    if(isNull(err))
                    {
                        return callback(err,results[0].count);
                    }
                    else
                    {
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

var updateResource = function(currentResource, newResource, db, cb)
{
    const newDescriptors = newResource.getDescriptors();

    currentResource.replaceDescriptorsInTripleStore(
        newDescriptors,
        db,
        function(err, result)
        {
            cb(err, result);
        }
    );
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

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: DbConnection.resource,
                value: likeID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                let likeExists = false;
                if (results.length > 0) {
                    likeExists = true;
                }
                cb(false, likeExists);
            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var removeOrAdLike = function (postID, userUri, cb) {
    const self = this;

    const query =
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
            if(isNull(err))
            {
                let likeExists = false;
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
            if(isNull(err))
            {
                async.map(results, function(commentUri, callback){
                    Comment.findByUri(commentUri.commentURI, function(err, comment)
                    {
                        return callback(false,comment);
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

const getSharesForAPost = function (postID, cb) {
    const self = this;

    const query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:postURI [1]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: DbConnection.resource,
                value: postID
            }
        ]),
        function (err, results) {
            if (isNull(err)) {
                async.map(results, function (shareObject, callback) {
                    Share.findByUri(shareObject.shareURI, function (err, share) {
                        return callback(null, share);
                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, shares) {
                    cb(false, shares);
                });
            }
            else {
                cb(true, "Error shares for a post");
            }
        });
};

exports.getPostShares = function (req, res) {
    const postUri = req.body.postID;
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
    let acceptsHTML = req.accepts('html');
    const acceptsJSON = req.accepts('json');

    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        const currentUser = req.user;
        const postURI = req.body.postURI;
        let resultInfo;

        Post.findByUri(postURI, function(err, post)
        {
            if(isNull(err) && !isNull(post))
            {
                getNumLikesForAPost(post.uri, function (err, likesArray) {
                    if(isNull(err))
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
        req.flash('error', "Invalid Request");
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

var userLikedAPost = function(postID, userUri, cb )
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
            if(isNull(err))
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
    const self = this;

    const query =
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
            if(isNull(err))
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
    const self = this;

    if(projectUrisArray && projectUrisArray.length > 0)
    {
        async.map(projectUrisArray, function (uri, cb1) {
            cb1(null, '<'+uri+ '>');
        }, function (err, fullProjects) {
            const projectsUris = fullProjects.join(" ");
            let query =
                "WITH [0] \n" +
                "SELECT DISTINCT ?uri \n" +
                "WHERE { \n" +
                "VALUES ?project { \n" +
                projectsUris +
                "} \n" +
                "?uri ddr:modified ?date. \n" +
                "?uri rdf:type ddr:Post. \n" +
                "?uri ddr:projectUri ?project. \n" +
                "} \n " +
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
                    if(isNull(err))
                    {
                        return callback(err,results);
                    }
                    else
                    {
                        return callback(true, "Error fetching posts in getAllPosts");
                    }
                });
        });
    }
    else
    {
        //User has no projects
        var results = [];
        return callback(null, results);
    }
};

exports.post = function (req, res) {
    const currentUser = req.user;
    const postUri = "http://" + req.headers.host + req.url;
    res.render('social/showPost',
        {
            postUri : postUri
        }
    );
};

exports.getShare = function (req, res) {
    const currentUser = req.user;
    const shareUri = "http://" + req.headers.host + req.url;
    const fileVersionType = "http://dendro.fe.up.pt/ontology/0.1/FileVersion";

    //TODO find the share in database
    //TODO see if it has ddr:postURI or ddr:fileVersionUri
    //TODO redirect to social/showPost or social/showFileVersion

    let query =
        "WITH [0] \n" +
        "SELECT ?type \n" +
        "WHERE { \n" +
        "[1] ddr:fileVersionUri ?fileVersionUri \n" +
        "}";

    query = DbConnection.addLimitsClauses(query, null, null);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : DbConnection.resourceNoEscape,
                value: shareUri
            }
        ]),
        function(err, results) {
            if(isNull(err))
            {
                //var types =_.pluck(results, 'type');

                /*if(types.indexOf(fileVersionType) > -1)
                {
                    res.render('social/showFileVersion',
                        {
                            fileVersionUri : shareUri
                        }
                    );
                }
                else
                {
                    res.render('social/showPost',
                        {
                            postUri : shareUri
                        }
                    );
                }*/
                if(results.length > 0)
                {
                    res.render('social/showFileVersion',
                        {
                            fileVersionUri : shareUri
                        }
                    );
                }
                else
                {
                    res.render('social/showPost',
                        {
                            postUri : shareUri
                        }
                    );
                }
            }
            else
            {
                const errorMsg = "Error fetching share";
                res.send(500, errorMsg);
            }
        });
};