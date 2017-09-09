const path = require("path");
const async = require("async");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
const Comment = require(Pathfinder.absPathInSrcFolder("/models/social/comment.js")).Event;
const uuid = require("uuid");
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const db = Config.getDBByID();
const db_social = Config.getDBByID("social");

function Post (object)
{
    const self = this;
    self.addURIAndRDFType(object, "post", Post);
    Post.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + "/posts/" + newId;
    }




    self.ddr.numLikes = 0;

    return self;
}

Post.prototype.getComments = function (cb) {
    var self = this;

    var query =
        "SELECT ?commentURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?commentURI rdf:type ddr:Comment. \n" +
        "?commentURI ddr:postURI [1]. \n" +
        "?commentURI dcterms:modified ?date. \n " +
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
                value : self.uri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.map(results, function(commentInfo, callback){
                    Comment.findByUri(commentInfo.commentURI, function(err, comment)
                    {
                        callback(false,comment);
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

Post.prototype.getNumLikes = function (cb) {
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
                value : self.uri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                cb(false, results);
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

Post.prototype.getLikes = function (cb) {
    var self = this;
    let resultInfo;

    self.getNumLikes(function (err, likesArray) {
        if(!err)
        {
            if(likesArray.length)
            {
                resultInfo = {
                    postURI: self.uri, numLikes : likesArray.length, usersWhoLiked : _.pluck(likesArray, 'userURI')
                };
            }
            else
            {
                resultInfo = {
                    postURI: self.uri, numLikes : 0, usersWhoLiked : 'undefined'
                };
            }
            cb(null, resultInfo);
        }
        else
        {
            console.error("Error getting likesInfo from a post");
            console.error(err);
            cb(true, "Error getting likesInfo from a post");
        }
    });
};

Post.prototype.getShares = function (cb) {
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
                value : self.uri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.map(results, function(shareObject, callback){
                    //Share.findByUri(shareObject.shareURI, function(err, share)
                    const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;
                    Resource.findByUri(shareObject.shareURI, function(err, share)
                    {
                        callback(false,share);
                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                        //}, null, db_social.graphUri, null);
                    }, null, db_social.graphUri, false, null, null);
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

Post = Class.extend(Post, Event, "ddr:Post");

module.exports.Post = Post;


