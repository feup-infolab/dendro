const path = require("path");
const async = require("async");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Event = require(Pathfinder.absPathInSrcFolder("/models/social/event.js")).Event;
const Comment = require(Pathfinder.absPathInSrcFolder("/models/social/comment.js")).Comment;
const uuid = require("uuid");
const DbConnection = require(Pathfinder.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Elements = require(Pathfinder.absPathInSrcFolder("/models/meta/elements.js")).Elements;
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
        "?commentURI ddr:modified ?date. \n " +
        "} \n" +
        "ORDER BY ASC(?date) \n";

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : self.uri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.mapSeries(results, function(commentInfo, callback){
                    Comment.findByUri(commentInfo.commentURI, function(err, comment)
                    {
                        callback(err,comment);
                        //}, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, comments) {
                    cb(err, comments);
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

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : self.uri
            }
        ]),
        function(err, results) {
            if(isNull(err))
            {
                cb(err, results);
            }
            else
            {
                cb(err, "Error fetching children of project root folder");
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

    db.connection.executeViaJDBC(query,
        DbConnection.pushLimitsArguments([
            {
                type : Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type : Elements.types.resource,
                value : self.uri
            }
        ]),
        function(err, results) {
            if(!err)
            {
                async.mapSeries(results, function(shareObject, callback){
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

Post.prototype.getOwnerProject = function(callback)
{
    const self = this;
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "FROM [1] \n" +
        "WHERE \n" +
        "{ \n" +
        "   [2] ddr:projectUri ?uri. \n" +
        "   ?uri rdf:type ddr:Project \n" +
        "} ";

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.types.resource,
                value: self.uri
            }
        ],
        function(err, result) {
            if(isNull(err))
            {
                if(result instanceof Array && result.length === 1)
                {
                    const Project = require(Pathfinder.absPathInSrcFolder("/models/project.js")).Project;
                    Project.findByUri(result[0].uri, function(err, project){
                        callback(err,project);
                    });
                }
                else
                {
                    return callback(1, "Invalid result set or no parent PROJECT found when querying for the parent project of" + self.uri);
                }
            }
            else
            {
                return callback(1, "Error reported when querying for the parent PROJECT of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

Post = Class.extend(Post, Event, "ddr:Post");

module.exports.Post = Post;


