var Config = function() { return GLOBAL.Config; }();

var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Ontology = require(Config.absPathInSrcFolder("/models/meta/ontology.js")).Ontology;
var ArchivedResource = require(Config.absPathInSrcFolder("/models/versions/archived_resource.js")).ArchivedResource;
var InformationElement = require(Config.absPathInSrcFolder("/models/directory_structure/information_element.js")).InformationElement;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var Project = require(Config.absPathInSrcFolder("/models/project.js")).Project;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var Progress = require(Config.absPathInSrcFolder("/models/game/progress.js")).Progress;
var Medal = require(Config.absPathInSrcFolder("/models/game/medal.js")).Medal;
var MedalType = require(Config.absPathInSrcFolder("/models/game/medal_type.js")).MedalType;
var Rating = require(Config.absPathInSrcFolder("/models/game/rating.js")).Rating;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var _ = require('underscore');
var request = require('request');

var async = require('async');

var self = this;

exports.getDescriptorRating = function (req, res) {
    var uri = req.body.uri;
    getRatings(uri,function (err, ratings) {
        if(err)
        {
            res.status(500).json({
                result: "Error",
                message: "Error getting comments from a post " + JSON.stringify(ratings)
            });
        }
        else
        {
            res.json(ratings);
        }
    });
};

exports.thumb = function (req, res) {
    var uri = req.body.uri;
    var descriptor =req.body.descriptor;
    var upOrDown = req.body.upOrDown;
    var scoreValue=0;

    if(upOrDown=="up")
    {
        scoreValue=1;
    }
    else
    {
        scoreValue=-1;
    }
    getRatings(uri,function(err,rating){
        if(!err)
        {
            if(rating[0]==null)
            {
                console.log("[INFO] Don't exist rating for this descriptor already");

                var newRating= new Rating({
                    gm: {
                        hasDescriptor : descriptor,
                        hasResource: uri,
                        score: scoreValue
                    }
                });

                newRating.save(function(err,result){

                });
            }
            else
            {
                var newScore=rating[0].gm.score+scoreValue;
                Rating.findByUri(rating[0].uri,function (err,existRating){
                    if(!err)
                    {
                        console.log(existRating);
                        existRating.update(newScore,function (err,result) {

                        });
                    }
                    else
                    {

                    }
                } )
            }
            res.json({
                result : "OK",
                message : "Post liked successfully"
            });

        }
        else
        {
            res.json({
                result : "OK",
                message : "Post liked successfully"
            });
        }
    },descriptor);
};

var getRatings = function (uri, cb, descriptor) {
    var self = this;
    var partialquery="?ratingURI gm:hasResource [1]. \n";
    var args=[];
    args.push( {
        type : DbConnection.resourceNoEscape,
        value: db.graphUri
    });
    args.push( {
        type : DbConnection.resource,
        value : uri
    });

    if(descriptor!=null)
    {
        partialquery+="?ratingURI gm:hasDescriptor [2]. \n";
        args.push({
            type : DbConnection.resource,
            value : descriptor
        });
    }
    var query =
        "SELECT ?ratingURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        partialquery+
        "}" ;


    db.connection.execute(query,
        DbConnection.pushLimitsArguments(args),
        function(err, results) {
            if(!err)
            {
                async.map(results, function(result, callback){
                    Rating.findByUri(result.ratingURI, function(err, rating)
                    {
                        callback(false,rating);
                    }, null, db.graphUri, null);
                }, function (err, ratings) {
                    cb(false, ratings);
                });


            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var ratingExists = function (uri, descriptor, cb) {
    var self = this;

    var query =
        "SELECT ?ratingURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?ratingURI gm:hasResource [1]. \n" +
        "?ratingURI gm:hasDescriptor [2]. \n" +
        "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type : DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type : DbConnection.resource,
                value : uri
            },
            {
                type : DbConnection.resource,
                value : descriptor
            }
        ]),
        function(err, results) {
            if(!err)
            {
                var ratingExists = false;
                if(results.length > 0)
                {
                    ratingExists=true;
                        cb(err, ratingExists);

                }
                else
                    cb(err, ratingExists);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};