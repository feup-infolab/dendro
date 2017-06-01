var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Change = require(Config.absPathInSrcFolder("/models/versions/change.js")).Change;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
var User = require(Config.absPathInSrcFolder("/models/user.js")).User;
var Comment = require(Config.absPathInSrcFolder("/models/social/comment.js")).Comment;
var Share = require(Config.absPathInSrcFolder("/models/social/share.js")).Share;

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var _ = require('underscore');
var async = require('async');
var uuid = require('uuid');

//NFO ontology or NIE ontology
/*
 {
 "_id" : ObjectId("54b03c94e94e9ea32d000001"),
 "filename" : "http://127.0.0.1:3001/project/datanotes2/data/Nielsen[1994].pdf", -> nfo.fileName
 "contentType" : "binary/octet-stream",
 "length" : 259713, -> nie.byteSize
 "chunkSize" : 262144,
 "uploadDate" : ISODate("2015-01-09T20:39:49.050Z"), nie.created
 "aliases" : null,
 "metadata" : {
 "project" : "http://127.0.0.1:3001/project/datanotes2",
 "type" : "nie:File",
 creator: "user uri of the creator" nco.creator
 },
 "md5" : "b3bbe77e563bd4784c21db08bbc3066a" -> nfo.hashAlgorithm
 }*/
function FileVersion (object)
{
    FileVersion.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/fileVersions/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:FileVersion";

    return self;
}

FileVersion.prototype.getComments = function (cb) {
    var self = this;

    var query =
        "SELECT ?commentURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?commentURI rdf:type ddr:Comment. \n" +
        "?commentURI ddr:fileVersionUri [1]. \n" +
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
                async.map(results, function(commentUri, callback){
                    Comment.findByUri(commentUri.commentURI, function(err, comment)
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
                cb(true, "Error fetching comments for a fileVersion");
            }
        });
};

FileVersion.prototype.getLikes = function (callback) {
    var self = this;
    var resultInfo;
    self.getNumLikesForAFileVersion(function (err, likesArray) {
        if(!err)
        {
            if(likesArray.length)
            {
                resultInfo = {
                    fileVersionUri: self.uri, numLikes : likesArray.length, usersWhoLiked : _.pluck(likesArray, 'userURI')
                };
            }
            else
            {
                resultInfo = {
                    fileVersionUri: self.uri, numLikes : 0, usersWhoLiked : 'undefined'
                };
            }
            callback(null, resultInfo);
        }
        else
        {
            callback(err, likesArray);
        }

    });
};

FileVersion.prototype.getShares = function (cb) {
    var self = this;

    var query =
        "SELECT ?shareURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?shareURI rdf:type ddr:Share. \n" +
        "?shareURI ddr:fileVersionUri [1]. \n" +
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
                    Share.findByUri(shareObject.shareURI, function(err, share)
                    {
                        callback(false,share);
                    /*}, Ontology.getAllOntologiesUris(), db_social.graphUri);*/
                    }, null, db_social.graphUri, null);
                }, function (err, shares) {
                    cb(false, shares);
                });
            }
            else
            {
                cb(true, "Error shares for a FileVersion");
            }
        });
};

FileVersion.prototype.getNumLikesForAFileVersion = function (cb) {
    var self = this;

    var query =
        "SELECT ?likeURI ?userURI \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "?likeURI rdf:type ddr:Like. \n" +
        "?likeURI ddr:fileVersionUri [1]. \n" +
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
                cb(true, "Error fetching number of likes for a fileVersion");
            }
        });
};

FileVersion = Class.extend(FileVersion, Resource);

module.exports.FileVersion = FileVersion;

