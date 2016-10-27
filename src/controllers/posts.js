var Post = require('../models/social/post.js').Post;
var Like = require('../models/social/like.js').Like;
var Comment = require('../models/social/comment.js').Comment;
var Share = require('../models/social/share.js').Share;
var Ontology = require('../models/meta/ontology.js').Ontology;
var Project = require('../models/project.js').Project;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

//NELSON
var app = require('../app');

exports.all = function(req, res){
    var currentUser = req.session.user;
    var acceptsHTML = req.accepts('html');
    var acceptsJSON = req.accepts('json');
    var username = currentUser.uri;

    var pingForNewPosts = true;
    var currentPage = req.query.currentPage;
    console.log('currentPage: ', currentPage);
    var index = currentPage == 1? 0 : currentPage*5;
    console.log('index is: ', index);
    var maxResults = 10;

    /*if(acceptsJSON && !acceptsHTML)
     {
     //obtain all user projects
     Project.findByCreatorOrContributor(req.session.user.uri, function(err, projects) {
     //console.log('Projects:',JSON.stringify(projects));
     //console.log('project:', JSON.stringify(projects[0]));
     console.log('Project title is: ', projects[0].dcterms.title);
     projects[0].getRecentProjectWideChanges(function(err, changes){
     //console.log('changes are:', JSON.stringify(changes[1].changes));
     //console.log('changes are:', JSON.stringify(changes[1].changes));
     console.log('Item changed:', changes[0].uri);
     async.map(changes, function(change, callback){
     //Descriptor.findByUri(descriptor.uri, callback);
     //console.log('change is:', change.changes[0].ddr);
     //console.log('changeType is:', change.changes[0].ddr.changeType);
     //console.log('New value is:', change.changes[0].ddr.newValue);
     //console.log('changedDescriptor:', change.changes[0].ddr.changedDescriptor.label);
     //console.log('-------------------------------------------------------------------');
     },
     function(err, fullDescriptors)
     {
     callback(err, fullDescriptors);
     });
     });
     });
     //Post.getArchivedVersions(0, 1, function(err, latestRevisionArray){
     //if(!err && latestRevisionArray instanceof Array && latestRevisionArray.length == 1)
     //{
     //callback(0, latestRevisionArray[0]);
     //}
     //else if(!err && latestRevisionArray instanceof Array && latestRevisionArray.length == 0)
     //{
     //callback(0, null);
     //}
     //else
     //{
     //var error = "Error occurred fetching latest version of resource " + self.uri + ". Error returned : " + latestRevisionArray;
     //console.error(error);
     //callback(1, error);
     //}
     // console.log('In get getArchivedVersions:', latestRevisionArray);
     //});
     }
     else
     {
     var msg = "This method is only accessible via API. Accepts:\"application/json\" header is missing";
     req.flash('error', "Invalid Request");
     console.log(msg);
     res.status(400).json({
     result : "Error",
     message : msg
     });
     }*/



    if(acceptsJSON && !acceptsHTML)  //will be null if the client does not accept html
    {
        if(pingForNewPosts)
        {
            console.log('vai fazer pingForNewPosts');
            pingNewPosts(currentUser, function (error, newposts) {
                if(error)
                {
                    console.log('deu error');
                    res.status(500).json({
                        result : "Error",
                        message : "Error pinging posts. " + JSON.stringify(error)
                    });
                }
                else
                {
                    //TODO create a new function that only gets the like uri's ordered by date and with pagination
                    //TODO base implementation on project.getChangesSocial
                    //getAllPosts(callback, startingResultPosition, maxResults);
                    getAllPosts(function (err, results) {
                        if(!err)
                        {
                            console.log('vai mandar os results');
                            console.log('results.length: ' , results.length);
                            res.json(results);
                        }
                        else{
                            console.log('err at getAllPosts: ', err);
                            res.status(500).json({
                                result : "Error",
                                message : "Error getting posts. " + JSON.stringify(err)
                            });
                        }
                    }, index, maxResults);
                    /*Post.all(req, function (err, posts)
                    {
                        if (!err)
                        {
                            console.log('posts.length is:', posts.length);
                            async.map(posts, function(post, callback){
                                Post.findByUri(post.uri, function (err, loadedPost) {
                                    if(err)
                                        callback(err, null);
                                    else
                                    {
                                        console.log('loadedPost is: ', loadedPost);
                                        callback(null, loadedPost);
                                    }

                                }, Ontology.getAllOntologiesUris(), db_social.graphUri)
                            }, function(err, loadedPosts){
                                if(!err)
                                {
                                    console.log('vai mandar os loadedPosts');
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
                    */
                }
            });
        }
        else
        {
            console.log('não vai fazer pingForNewposts');
            Post.all(req, function (err, posts)
            {
                if (!err)
                {
                    console.log('posts.length is:', posts.length);
                    async.map(posts, function(post, callback){

                        Post.findByUri(post.uri, function (err, loadedPost) {
                            if(err)
                                callback(err, null);
                            else
                            {
                                callback(null, loadedPost);
                            }

                        }, Ontology.getAllOntologiesUris(), db_social.graphUri)

                        /*Post.findByUri(post.uri, function(err, loadedPost){
                         if(!err)
                         {
                         var updatedPost = loadedPost;

                         getNumLikesForAPost(loadedPost.uri, function (err, likesArray) {
                         if(likesArray.length)
                         {
                         updatedPost.ddr.numLikes = likesArray.length;
                         var usersWhoLiked = _.pluck(likesArray, 'userURI');
                         console.log('usersWhoLiked is:');
                         console.log(usersWhoLiked);
                         updatedPost.ddr.usersWhoLiked = usersWhoLiked.toString();
                         }

                         if(!err)
                         {
                         updateResource(loadedPost, updatedPost, db_social.graphUri, function (error, data) {
                         if(!error)
                         {
                         console.log('atualizou o numLikes com sucesso');
                         callback(null, loadedPost);
                         }
                         else
                         {
                         callback(err, null);
                         }
                         });

                         }
                         else
                         {
                         callback(err, null);
                         }

                         });
                         }
                         else
                         {
                         callback(err, null);
                         }
                         }, Ontology.getAllOntologiesUris(), db_social.graphUri);*/
                        //TODO -> respond with these post uri's
                        //callback(null, post.uri);//comment this
                    }, function(err, loadedPosts){
                        if(!err)
                        {
                            console.log('vai mandar os loadedPosts');
                            loadedPosts.sort(sortPostsByModifiedDate);//sort posts by modified date
                            //console.log(loadedPosts);
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
        console.log(msg);
        res.status(400).json({
            result : "Error",
            message : msg
        });
    }
};

function sortPostsByModifiedDate(postA, postB) {
    var a = new Date(postA.dcterms.modified),
        b = new Date(postB.dcterms.modified);

    console.log('postA:', postA);
    console.log('postB:', postB);

    console.log('at sortPostsByModifiedDate');
    console.log('a: ', a);
    console.log('b: ', b);
    console.log('a.getTime(): ', a.getTime());
    console.log('b.getTime(): ', b.getTime());
    console.log('a.getTime() - b.getTime(): ', a.getTime() - b.getTime());

    return (a.getTime() - b.getTime());
}


//function that pings metadata changes from dendro_graph to build the posts in social_dendro graph
function pingNewPosts(sessionUser, cb) {

    console.log('in getNewPosts function');
    console.log('in pingNewPostsFunction');
    var currentUserUri = sessionUser.uri;
    var numPostsCreated = 0;
    Project.findByCreatorOrContributor(currentUserUri, function(err, projects) {
        //console.log('Projects:',JSON.stringify(projects));
        //console.log('project:', JSON.stringify(projects[0]));
        if(projects.length > 0)
        {
            console.log('projects.length is:', projects.length);
            async.map(projects, function (project, cb1) {
                    console.log('Project title is: ', project.dcterms.title);
                    var socialUpdatedAt = project.dcterms.socialUpdatedAt ? project.dcterms.socialUpdatedAt : '1970-09-21T19:27:46.578Z';
                    //2016-10-11T15:50:24.586Z
                    console.log('socialUpdatedAt from project is: ', socialUpdatedAt);

                    project.getRecentProjectWideChangesSocial(function(err, changes){
                    //project.getRecentProjectWideChanges(function(err, changes){
                        //console.log('changes are:', JSON.stringify(changes[1].changes));
                        //console.log('changes are:', JSON.stringify(changes[1].changes));
                        console.log('changes.length are: ', changes.length);
                        console.log('change:');
                        if(changes.length > 0)
                        {
                            //console.log('Item changed:', changes[0].uri);
                            async.map(changes, function(change, callback){
                                    //Descriptor.findByUri(descriptor.uri, callback);
                                    //console.log('change is:', change.changes[0].ddr);
                                    /*console.log('changeType is:', change.changes[0].ddr.changeType);
                                     console.log('New value is:', change.changes[0].ddr.newValue);
                                     console.log('changedDescriptor:', change.changes[0].ddr.changedDescriptor.label);
                                     console.log('-------------------------------------------------------------------');*/

                                    if(change.changes && change.changes[0])// change.changes[0])
                                    {
                                        console.log('TITLE HERE:', project.dcterms.title);
                                        //console.log('ITEM HERE:', changes[0].uri);
                                        console.log('NEW ITEM:', change.changes[0].uri);


                                        console.log('changeType: ', change.changes[0].ddr.changeType);
                                        console.log('newValue: ', change.changes[0].ddr.newValue);
                                        //console.log('changedDescriptor: ', change.changes[0].ddr.changedDescriptor.label || null);
                                        console.log('hasContent: ', change.changes[0].uri);
                                        console.log('title: ', project.dcterms.title);

                                        console.log('change.changes[0]: ');
                                        console.log(change.changes[0]);

                                        var newPost = new Post({
                                            ddr: {
                                                //hasContent: 'Project:' + project.dcterms.title + ' change is:' + change.changes[0].ddr
                                                //item: changes[0].uri,
                                                changeType: change.changes[0].ddr.changeType,
                                                newValue: change.changes[0].ddr.newValue,
                                                changedDescriptor: change.changes[0].ddr.changedDescriptor? change.changes[0].ddr.changedDescriptor.label : 'undefined',
                                                hasContent: change.changes[0].uri,
                                                numLikes: 0
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
                                                console.log('Post saved sucessfully');
                                                numPostsCreated++;
                                                callback(err, post);
                                            }
                                            else
                                            {
                                                console.log('Error saving post', post);
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
                                    //TODO update socialUpdatedAt
                                    var updatedProject = project;
                                    updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                                    updateResource(project, updatedProject, db.graphUri, function (error, data) {
                                        console.log('updated project');
                                        cb1(err, fullDescriptors);
                                    });
                                    //cb1(err, fullDescriptors);
                                });
                        }
                        else
                        {
                            console.log('no changes detected');
                            //TODO update socialUpdatedAt
                            //HERE
                            var updatedProject = project;
                            updatedProject.dcterms.socialUpdatedAt = new Date().toISOString();
                            updateResource(project, updatedProject, db.graphUri, function (error, data) {
                                console.log('updated project');
                                console.log('data is: ');
                                console.log(data);
                                cb1(null,null);
                            });

                            //cb1(null,null);
                        }
                    //},null,null,'2015-09-21T19:27:46.578Z');
                    },null,null,socialUpdatedAt);
                },
                function (err, fullProjects) {
                    console.log('fullProjects.length is:', fullProjects.length);
                    console.log('numPostCreated is:', numPostsCreated);
                    cb(err, fullProjects);
                });
        }
        else
        {
            cb(null,null);
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
        console.log('err getNumLikes:');
        console.log(err);

        console.log('data numLikes is:');
        console.log(data);
        /*
         res.json({
         result : "OK",
         message : "Post liked successfully"
         });*/
    });
};


exports.getPost_controller = function (req, res) {
    console.log('at get post controller');
    var currentUser = req.session.user;
    var postURI = req.body.postID;
    console.log('postURI:', postURI);
    Post.findByUri(req.body.postID, function(err, post)
    {
        if(!err)
        {
            //app.io.emit('chat message', post);
            var eventMsg = 'postURI:' + postURI.uri;
            //var eventMsg = 'postURI:';
            console.log('eventMsg: ', eventMsg);
            console.log('post:');
            console.log(post);
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
    console.log('req.body.postID:', req.body.postID);
    console.log('req.body.shareMsg:', req.body.shareMsg);
    var shareMsg = req.body.shareMsg;
    Post.findByUri(req.body.postID, function(err, post)
    {
        var newShare = new Share({
            ddr: {
                userWhoShared : currentUser.uri,
                postURI: post.uri,
                shareMsg: shareMsg
            }
        });

        newShare.save(function(err, resultShare)
        {
            if(!err)
            {
                console.log('Olha gravou o newShare');
                console.log('result newShare is:');
                console.log(resultShare);

                res.json({
                    result : "OK",
                    message : "Post shared successfully"
                });
            }
            else
            {
                console.log('err is:');
                console.log(err);
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
            console.log('there was an error getting the comments');
            console.log(comments);
            res.status(500).json({
                result: "Error",
                message: "Error getting comments from a post " + JSON.stringify(comments)
            });
        }
        else
        {
            console.log('The comments are:');
            console.log(comments);
            res.json(comments);
        }
    });

};

exports.comment = function (req, res) {
    var currentUser = req.session.user;
    console.log('req.body.postID:', req.body.postID);
    console.log('req.body.commentMsg:', req.body.commentMsg);
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
                console.log('Olha gravou o comment');
                console.log('result comment is:');
                console.log(resultComment);

                res.json({
                    result : "OK",
                    message : "Post commented successfully"
                });
            }
            else
            {
                console.log('err is:');
                console.log(err);
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

    console.log('In checkIfPostIsLikedByUser');
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
    console.log('vai fazer o FINDBYURI');
    console.log('req.body.postID:', req.body.postID);
    var currentUser = req.session.user;

    removeOrAdLike(req.body.postID, currentUser.uri, function (err, likeExists) {
        if(!err)
        {
            console.log('likeExists is:', likeExists);
            /*res.json({
             result : "OK",
             message : "Post liked successfully"
             });*/
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
                    console.log('post.uri:', post.uri);
                    var newLike = new Like({
                        ddr: {
                            userWhoLiked : currentUser.uri,
                            postURI: post.uri
                        }
                    });

                    newLike.save(function(err, resultLike)
                    {
                        if(!err)
                        {
                            console.log('Olha gravou o like');
                            console.log('result like is:');
                            console.log(resultLike);
                            res.json({
                                result : "OK",
                                message : "Post liked successfully"
                            });
                        }
                        else
                        {
                            console.log('err is:');
                            console.log(err);
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

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                //value : db.graphUri
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
                console.log('results of delete:', results);
                if(results.length > 0)
                {
                    console.log('tem results delete');
                    likeExists = true;
                }
                cb(false, likeExists);
            }
            else
            {
                console.log('DEU ERRO A PROCURAR');
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
        //"?likeURI ddr:postURI ?postID \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                //value : db.graphUri
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
                console.log('results:', results);
                if(results.length > 0)
                {
                    console.log('tem results');
                    removeLike(results[0].likeURI, userUri, function (err, data) {
                        console.log('removeLike DEBUG:', data);
                        likeExists = true;
                        cb(err, likeExists);
                    });
                    //likeExists = true;
                }
                else
                    cb(err, likeExists);
            }
            else
            {
                console.log('DEU ERRO A PROCURAR');
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

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                //value : db.graphUri
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
                    console.log('commentUri:', commentUri.commentURI);
                    Comment.findByUri(commentUri.commentURI, function(err, comment)
                    {
                        console.log('comment is:', comment);
                        callback(false,comment);
                    }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                }, function (err, comments) {
                    console.log('comments are here:', comments);
                    cb(false, comments);
                });
            }
            else
            {
                console.log('DEU ERRO A PROCURAR');
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
            console.log('there was an error getting the shares');
            console.log(shares);
            res.status(500).json({
                result: "Error",
                message: "Error getting shares from a post " + JSON.stringify(shares)
            });
        }
        else
        {
            console.log('The shares are:');
            console.log(shares);
            res.json(shares);
        }
    });

};

exports.postLikesInfo = function (req, res) {
    var currentUser = req.session.user;
    var postURI = req.body.postURI;
    var resultInfo;

    console.log('at postLikesInfo in posts controller');
    getNumLikesForAPost(postURI, function (err, likesArray) {
        if(!err)
        {
            if(likesArray.length)
            {
                /*
                 updatedPost.ddr.numLikes = likesArray.length;
                 var usersWhoLiked = _.pluck(likesArray, 'userURI');
                 console.log('usersWhoLiked is:');
                 console.log(usersWhoLiked);
                 updatedPost.ddr.usersWhoLiked = usersWhoLiked.toString();*/
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
            console.log('resultInfo: ', resultInfo);
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
        //"?likeURI ddr:postURI ?postID \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked [2]. \n" +
        "} \n";

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                //value : db.graphUri
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
                console.log('DEU ERRO A PROCURAR');
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
        //"?likeURI ddr:postURI ?postID \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:postURI [1]. \n" +
        "?likeURI ddr:userWhoLiked ?userURI . \n" +
        "} \n";

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                //value : db.graphUri
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
                console.log('DEU ERRO A PROCURAR');
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
var getAllPosts = function (callback, startingResultPosition, maxResults) {
    //based on getRecentProjectWideChangesSocial
    var self = this;
    console.log('startingResultPosition: ', startingResultPosition);
    console.log('maxResults: ', maxResults);

    var query =
        "WITH [0] \n" +
        "SELECT DISTINCT ?uri \n" +
        "WHERE { \n" +
        "?uri dcterms:modified ?date. \n" +
        "?uri rdf:type ddr:Post. \n" +
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
                console.log('executed getPosts query successfully');
                if(results.length > 0)
                {
                    console.log('has post results:');
                    console.log(results);
                }
                callback(err,results);
            }
            else
            {
                console.log('DEU ERRO A PROCURAR');
                callback(true, "Error fetching posts in getAllPosts");
            }
        });

};