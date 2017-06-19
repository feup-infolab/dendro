var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Event = require(Config.absPathInSrcFolder("/models/social/event.js")).Event;
var Comment = require(Config.absPathInSrcFolder("/models/social/comment.js")).Comment;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var uuid = require('uuid');

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var _ = require('underscore');
var async = require('async');

var redis = function(graphUri)
{
    if(graphUri == null || typeof graphUri === "undefined" || !graphUri)
    {
        if(GLOBAL.redis.default != null)
        {
            //console.log('ENTRAR DEFAULT REDIS:');
            return GLOBAL.redis.default;
        }
        else
        {
            console.error("DEU ASNEIRA");
            process.exit(1);
        }

    }
    else
    {
        return Config.caches[graphUri];
    }
};

function Post (object)
{
    Post.baseConstructor.call(this, object);
    var self = this;

    if(object.uri != null)
    {
        self.uri = object.uri;
    }
    else
    {
        self.uri = Config.baseUri + "/posts/" + uuid.v4();
    }

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Post";

    self.ddr.numLikes = 0;

    return self;
}

/*//TODO This should be in a separate model(MetadataChangesPost) extending the post class
Post.buildFromArchivedVersion = function (archivedVersion, project, callback) {
    //CREATE A POST FOR EACH ARCHIVED VERSION CHANGE
    //DON'T SAVE IT HERE
    var changeAuthor = archivedVersion.ddr.versionCreator;
    var numberOfChanges = archivedVersion.changes.length;
    var changesSortedByType = _.groupBy(archivedVersion.changes, function(change){ return change.ddr.changeType;});
    var hasNumberOfDescriptorsAdded = changesSortedByType.add ? changesSortedByType.add.length : 0;
    var hasNumberOfDescriptorsEdited = changesSortedByType.edit ? changesSortedByType.edit.length : 0;
    var hasNumberOfDescriptorsDeleted = changesSortedByType.delete ? changesSortedByType.delete.length : 0;
    var title = changeAuthor.split("/").pop() + " worked on " + numberOfChanges + " metadata changes";
    var versionUri = archivedVersion.uri;

    async.map(changesSortedByType, function(changeType, callback)
    {
        callback(null, changeType[0]);
    }, function(err, results){
        //Add to the post the number of changes added, edited, deleted
        //the number of changes total
        //the version uri for the full details
        //TODO MAYBE ADD THE URI OF THE RESOURCE????
        var newPost = new Post({
            ddr: {
                hasNumberOfDescriptorsAdded: hasNumberOfDescriptorsAdded,
                hasNumberOfDescriptorsEdited: hasNumberOfDescriptorsEdited,
                hasNumberOfDescriptorsDeleted: hasNumberOfDescriptorsDeleted,
                hasNumberOfChanges : numberOfChanges,
                //hasContent: JSON.stringify(results),//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting -> fazer JSON.parse depois para aceder
                numLikes: 0,//isto não é necessário aqui
                projectUri: project.uri,
                refersTo : versionUri//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo
            },
            dcterms: {
                creator: changeAuthor,
                title: title
            },
            schema: {
                sharedContent: JSON.stringify(results)
            }
        });
        callback(null, newPost);
    });
};*/

//TODO This should be in another model(ManualPost) that extends the post class
Post.buildManualPost = function (project, creatorUri, postContent, callback) {
    //CREATE A POST WITH MANUAL CONTENT
    //DONT SAVE IT HERE

    //TODO PROPERTIES NEEDED
    //hasContent-> content of the post(name,path etc)
    //the resource it points to???
    //the user who did the work
    //the project
    //possible users to be mentioned in the post
    var newPost = new Post({
        ddr: {
            //hasContent: postContent.body,//substituir por sharedContent da SocialMediaPosting http://schema.org/SocialMediaPosting
            numLikes: 0,//isto não é necessário aqui
            projectUri: project.uri,
            refersTo : postContent.refersTo,//Já existe -> http://onto.dm2e.eu/schemas/dm2e#refersTo
            notifiedUsers : JSON.stringify(postContent.notifiedUsers)//não consigo encontrar nada já definido para isto
        },
        dcterms: {
            creator: creatorUri,
            title: postContent.title
        },
        schema: {
            sharedContent: JSON.stringify(postContent.body)
        }
    });
    callback(null, newPost);
};

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
                let Share = require(Config.absPathInSrcFolder("/models/social/share.js")).Share;
                async.map(results, function(shareObject, callback){
                    Share.findByUri(shareObject.shareURI, function(err, share)
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

Post.prefixedRDFType = "ddr:Post";

Post = Class.extend(Post, Event);

module.exports.Post = Post;


