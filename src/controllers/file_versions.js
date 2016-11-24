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

    if(projectsUri && projectsUri.length > 0)
    {
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

        /*var query =
         "WITH [0] \n" +
         "SELECT DISTINCT ?uri \n" +
         "WHERE { \n" +
         "?uri nie:contentLastModified ?date. \n" +
         "?uri rdf:type ddr:FileVersions. \n" +
         "} \n "+
         "ORDER BY DESC(?date) \n";*/

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
    
    Project.findByCreatorOrContributor(currentUserUri, function (err, projects) {
       if(!err)
       {
           async.map(projects, function (project, cb1) {
               cb1(null, '<'+project.uri+ '>');
           }, function (err, fullProjects) {
               var projectsUris = fullProjects.join(" ");
               //getProjectFileVersions = function (projectsUri, startingResultPosition, maxResults, callback)
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