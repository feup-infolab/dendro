var Post = require('../models/social/post.js').Post;
var Like = require('../models/social/like.js').Like;
var Comment = require('../models/social/comment.js').Comment;
var Share = require('../models/social/share.js').Share;
var Ontology = require('../models/meta/ontology.js').Ontology;
var Project = require('../models/project.js').Project;
var FileVersion = require('../models/versions/file_versions.js').FileVersions;
var DbConnection = require("../kb/db.js").DbConnection;
var _ = require('underscore');

var async = require('async');
var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

//NELSON
var app = require('../app');

var numFileVersionsDatabaseAux = function (callback) {
    var query =
        "WITH [0] \n" +
        "SELECT (COUNT(DISTINCT ?uri) AS ?count) \n" +
        "WHERE { \n" +
        "?uri rdf:type ddr:FileVersions. \n" +
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
};

exports.numFileVersionsInDatabase = function (req, res) {
    //TODO get user projects
    numFileVersionsDatabaseAux(function (err, count) {
        if(!err)
        {
            console.log('count is: ', count);
            res.json(count);
        }
        else{
            console.log('error receiving count');
            console.log(err);
            res.status(500).json({
                result : "Error",
                message : "Error counting FileVersions. " + JSON.stringify(err)
            });
        }
    });
};

var getProjectFileVersions = function (projectsUri, startingResultPosition, maxResults, callback) {
    var self = this;

    //TODO uncomment this if after implementation of likes/comments/shares is done
    /*if(projectsUri && projectsUri.length > 0)
    {*/
        //TODO put this again after rest of implementation finished
        /*
        var query =
            "WITH [0] \n" +
            "SELECT DISTINCT ?fileVersion \n" +
            "WHERE { \n" +
            "VALUES ?project { \n" +
            //"[1] \n" +
            projectsUri + "\n" +
            "}. \n" +
            "?fileVersion nie:contentLastModified ?date. \n" +
            "?fileVersion rdf:type ddr:FileVersions. \n" +
            "?fileVersion ddr:projectUri ?project. \n" +
            "} \n "+
            "ORDER BY DESC(?date) \n";
        */

        /*WITH <http://127.0.0.1:3001/social_dendro>
        SELECT DISTINCT ?fileVersion
        WHERE {
        ?fileVersion nie:contentLastModified ?date.
            ?fileVersion rdf:type ddr:FileVersions.
        }
        ORDER BY DESC(?date)*/

        var query =
            "WITH [0] \n" +
            "SELECT DISTINCT ?fileVersion \n" +
            "WHERE { \n" +
            "?fileVersion nie:contentLastModified ?date. \n" +
            "?fileVersion rdf:type ddr:FileVersions. \n" +
            "} \n "+
            "ORDER BY DESC(?date) \n";

        query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

        db.connection.execute(query,
            DbConnection.pushLimitsArguments([
                {
                    type : DbConnection.resourceNoEscape,
                    value: db_social.graphUri
                }/*,
                 {
                 //type : DbConnection.resourceNoEscape,
                 type : DbConnection.stringNoEscape,
                 value: projectsUri
                 }*/
            ]),
            function(err, results) {
                if(!err)
                {
                    if(results.length > 0)
                    {
                        console.log(results);
                    }
                    callback(err,results);
                }
                else
                {
                    var msg = "Error fetching FileVersions";
                    callback(true, msg);
                }
            });
    //TODO uncomment this after the implementation is done
    /*
    }
    else
    {
        //User has no projects
        var results = [];
        callback(null, results);
    }*/
};

exports.all = function (req, res) {
    //TODO
        //get all user projects
        //query to get all fileVersions for with a specific project uri
        //order query by data
        //paginate results

    var currentUserUri = req.session.user.uri;
    
    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
       if(!err)
       {
           async.map(projects, function (project, cb1) {
               cb1(null, '<'+project.uri+ '>');
           }, function (err, fullProjects) {
               var projectsUris = fullProjects.join(" ");
               getProjectFileVersions(projectsUris, null, null, function (err, fileVersions) {
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
    console.log('req.body is: ', req.body);
    var fileVersionUri = req.body.fileVersionUri;

    console.log('fileVersionUri: ', fileVersionUri);

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

    console.log('at fileVersionLikesInfo in fileVersions controller');
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
            console.log('resultInfo: ', resultInfo);
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
    console.log('fileVersionUri:', fileVersionUri);
    var currentUser = req.session.user;

    /*
    removeOrAdLike(fileVersionUri, currentUser.uri, function (err, likeExists) {

    }*/

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
                    console.log('fileVersion.uri:', fileVersion.uri);
                    var newLike = new Like({
                        ddr: {
                            userWhoLiked : currentUser.uri,
                            postURI: fileVersion.uri
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
                                message : "FileVersion liked successfully"
                            });
                        }
                        else
                        {
                            console.log('err is:');
                            console.log(err);
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

    //query = DbConnection.addLimitsClauses(query, startingResultPosition, maxResults);

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
                console.log('results:', results);
                if(results.length > 0)
                {
                    console.log('tem results');
                    removeLikeInFileVersion(results[0].likeURI, currentUserUri, function (err, data) {
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
                cb(true, "Error Liking FileVersion");
            }
        });
};

exports.comment = function (req, res) {
    
};

exports.share = function (req, res) {
    
};