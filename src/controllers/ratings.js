var Config = function () {
    return GLOBAL.Config;
}();

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
var Feedback = require(Config.absPathInSrcFolder("/models/game/feedback.js")).Feedback;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;

var db = function () {
    return GLOBAL.db.default;
}();
var gfs = function () {
    return GLOBAL.gfs.default;
}();

var _ = require('underscore');
var request = require('request');

var async = require('async');

var self = this;

exports.getDescriptorRating = function (req, res) {
    var uri = req.body.uri;
    getRatings(uri, function (err, ratings) {
        if (err) {
            res.status(500).json({
                result: "Error",
                message: "Error getting ratings" + JSON.stringify(ratings)
            });
        }
        else {
            res.json(ratings);
        }
    });
};

exports.getFeedback = function (req, res) {
    var uri = req.body.uri;
    getFeedbacks(uri,req.session.user.uri, function (err, feedbacks) {
        if (err) {
            res.status(500).json({
                result: "Error",
                message: "Error getting ratings" + JSON.stringify(feedbacks)
            });
        }
        else {
            res.json(feedbacks);
        }
    });
};

exports.thumb = function (req, res) {
    var uri = req.params.requestedResource;
    var descriptor = req.body.descriptor;
    var upOrDown = req.body.upOrDown;
    var deltaValue = 0;
    var newScore = 0;
    var isAFolder=false;

    if(req.params.filepath!=null)
    {
        isAFolder=true;
    }
    else
    {
        isAFolder=false;
    }
    if (upOrDown == "up") {
        deltaValue = 1;
    }
    else {
        deltaValue = -1;
    }

    userRatesAlready(uri, descriptor, deltaValue,req.session.user.uri, function (err, userRates,sameRate,feedbackURI) {
                getRatings(uri, function (err, rating) {
                    var ratingToSave;
                    var newDelta=0;
                    if (!err) {
                        if(userRates && sameRate)
                        {
                            console.log("Já votou neste");
                            newScore = rating[0].gm.score - deltaValue;
                            Rating.findByUri(rating[0].uri, function (err, existRating) {
                                if (!err) {
                                    ratingToSave=existRating;
                                    ratingToSave.gm.score=newScore;
                                    ratingToSave.save(function(err,result){
                                        if(!err)
                                        {
                                            Feedback.findByUri(feedbackURI,function(err,feedbackToSave){
                                                if(!err)
                                                {
                                                    feedbackToSave.deleteAllMyTriples(function(err,result){
                                                        if(!err)
                                                        {
                                                            if(deltaValue==1)
                                                            {
                                                                newDelta=-5;
                                                            }
                                                            else
                                                            {
                                                                newDelta=2;
                                                            }

                                                            DescriptorLastEditor(uri, descriptor,-deltaValue, newDelta,isAFolder, function (err, result) {

                                                            });
                                                        }
                                                    })
                                                }
                                                else
                                                {

                                                }
                                            });
                                        }

                                    });

                                }
                                else {

                                }
                            });
                        }
                        else if(userRates && !sameRate)
                        {
                            console.log("Já votou mas não neste");
                            newScore = rating[0].gm.score + (2*deltaValue);
                            Rating.findByUri(rating[0].uri, function (err, existRating) {
                                if (!err) {
                                    ratingToSave=existRating;
                                    ratingToSave.gm.score=newScore;
                                    ratingToSave.save(function(err,result){
                                       if(!err)
                                       {
                                           Feedback.findByUri(feedbackURI,function(err,feedbackToSave){
                                               if(!err)
                                               {
                                                   feedbackToSave.gm.delta = deltaValue;
                                                   feedbackToSave.gm.score += deltaValue;
                                                   feedbackToSave.save(function (err, result) {
                                                       if(!err)
                                                       {
                                                           if(deltaValue==1)
                                                           {
                                                               newDelta=7;
                                                           }
                                                           else
                                                           {
                                                               newDelta=-7;
                                                           }
                                                           DescriptorLastEditor(uri, descriptor,(2*deltaValue), newDelta,isAFolder, function (err, result) {

                                                           });
                                                       }
                                                   });
                                               }
                                               else
                                               {

                                               }
                                           });
                                       }

                                    });


                                }
                                else {

                                }
                            });


                        }
                        else if(!userRates)
                        {
                            console.log("Não votou");
                            var newFeedback=function () {
                                var scoreBeforeUpdate = newScore - deltaValue;

                                var feedbackToSave = new Feedback({
                                    gm: {
                                        hasDescriptor: descriptor,
                                        hasResource: uri,
                                        score: scoreBeforeUpdate,
                                        delta: deltaValue,
                                        belongsTo: req.session.user.uri
                                    }
                                });

                                ratingToSave.save(function(err,result){

                                });

                                feedbackToSave.save(function (err, result) {
                                });

                                if(deltaValue==1)
                                {
                                    newDelta=5;
                                }
                                else
                                {
                                    newDelta=-2;
                                }

                                DescriptorLastEditor(uri, descriptor, deltaValue,newDelta,isAFolder, function (err, result) {

                                });
                            }

                            if(rating[0]==null)
                            {
                                console.log("[INFO] Don't exist rating for this descriptor already");
                                newScore = deltaValue;
                                ratingToSave = new Rating({
                                    gm: {
                                        hasDescriptor: descriptor,
                                        hasResource: uri,
                                        score: newScore
                                    }
                                });

                                newFeedback();

                            }
                            else
                            {
                                newScore = rating[0].gm.score + deltaValue;
                                Rating.findByUri(rating[0].uri, function (err, existRating) {
                                    if (!err) {
                                      ratingToSave=existRating;
                                      ratingToSave.gm.score=newScore;
                                        newFeedback();
                                    }
                                    else {

                                    }
                                })
                            }





                        }



                        res.json({
                            result: "OK",
                            message: "Rated successfully"
                        });
                    }
                    else {
                        res.json({
                            result: "Error",
                            message: "Don't rated"
                        });
                    }
                }, descriptor);



    });

};

var getRatings = function (uri, cb, descriptor) {
    var self = this;
    var partialquery = "?ratingURI gm:hasResource [1]. \n";
    var args = [];
    args.push({
        type: DbConnection.resourceNoEscape,
        value: db.graphUri
    });
    args.push({
        type: DbConnection.resource,
        value: uri
    });

    if (descriptor != null) {
        partialquery += "?ratingURI gm:hasDescriptor [2]. \n";
        args.push({
            type: DbConnection.resource,
            value: descriptor
        });
    }
    var query =
        "SELECT ?ratingURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?ratingURI rdf:type gm:Rating. \n" +
        partialquery +
        "}";


    db.connection.execute(query,
        DbConnection.pushLimitsArguments(args),
        function (err, results) {
            if (!err) {
                async.map(results, function (result, callback) {
                    Rating.findByUri(result.ratingURI, function (err, rating) {
                        callback(false, rating);
                    }, null, db.graphUri, null);
                }, function (err, ratings) {
                    cb(false, ratings);
                });


            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var getFeedbacks = function (uri,user, cb) {
    var self = this;


    var query =
        "SELECT ?feedbackURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?feedbackURI rdf:type gm:Feedback. \n" +
        "?feedbackURI gm:hasResource [1]. \n" +
        "?feedbackURI gm:belongsTo [2]. \n" +
        "}";


    db.connection.execute(query,
        DbConnection.pushLimitsArguments([{
            type: DbConnection.resourceNoEscape,
            value: db.graphUri
        },
            {
                type: DbConnection.resource,
                value: uri
            },
            {
                type: DbConnection.resource,
                value: user
            }]),
        function (err, results) {
            if (!err) {
                async.map(results, function (result, callback) {
                    Feedback.findByUri(result.feedbackURI, function (err, feedback) {
                        callback(false, feedback);
                    }, null, db.graphUri, null);
                }, function (err, feedbacks) {
                    cb(false, feedbacks);
                });


            }
            else {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

var DescriptorLastEditor = function (uri, descriptor, delta,newDelta,isAFolder, callback) {
    var self = this;
    var query="";
    if(isAFolder)
    {
        query =
            "SELECT ?user \n" +
            "FROM [0] \n" +
            "WHERE { \n" +
            "[1] [2] ?value.\n" +
            "[1] ddr:lastSavedBy ?user. \n" +
            "FILTER NOT EXISTS { \n" +
            "[1] ddr:isVersionOf ?some_resource .\n" +
            "}}\n";
    }
    else
    {
        query =
            "SELECT ?user \n" +
            "FROM [0] \n" +
            "WHERE { \n" +
            "[1] [2] ?value.\n" +
            "[1] dcterms:creator ?user. \n" +
            "FILTER NOT EXISTS { \n" +
            "[1] ddr:isVersionOf ?some_resource .\n" +
            "}}\n";
    }



    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: uri
            },
            {
                type: DbConnection.resource,
                value: descriptor
            }
        ]),
        function (err, results) {
            if (!err) {
                var user = results[0].user;


                Progress.findByUserAndType(user, "Rating", function (err, progress) {
                    if (!err) {
                        var newScore;

                        newScore = progress.gm.numActions + delta;

                        progress.update(newScore, function (err, result) {
                            if (!err) {
                                User.findByUri(user, function (err, userToUpdate) {
                                    if (!err) {

                                        userToUpdate.gm.score = userToUpdate.gm.score + newDelta;

                                        userToUpdate.save(function (err, result) {

                                        });

                                    }
                                    else {

                                    }
                                })

                            }
                            else {

                            }
                        });
                    }
                    else {

                    }

                })

                callback(true, "Error fetching children of project root folder");
            }
            else {
                callback(true, "Error fetching children of project root folder");
            }
        });
};

var userRatesAlready = function (uri, descriptor, delta, user, callback) {
    var query =
        "SELECT ?feedback,?delta \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?feedback rdf:type gm:Feedback.\n" +
        "?feedback gm:hasResource [1].\n" +
        "?feedback gm:hasDescriptor [2].\n" +
        "?feedback gm:belongsTo [3].\n" +
        "?feedback gm:delta ?delta.\n" +
        "}";




    db.connection.execute(query,
        DbConnection.pushLimitsArguments([{
                type: DbConnection.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: DbConnection.resource,
                value: uri
            },
            {
                type: DbConnection.resource,
                value: descriptor
            },
            {
                type: DbConnection.resource,
                value: user
            }]
        ),
        function (err, results) {
            if (!err) {

                var userRates=false;
                var sameRate= false;

                if(results.length>0)
                {
                    userRates=true;
                    if(results[0].delta==delta)
                    {
                        sameRate=true;
                    }


                    callback(false, userRates, sameRate,results[0].feedback);
                }
                else
                {

                    callback(false, userRates);
                }

            }
            else {
                callback(true, "Error fetching children of project root folder");
            }
        });
};

