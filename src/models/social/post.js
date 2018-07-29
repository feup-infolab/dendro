const path = require("path");
const async = require("async");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Event = rlequire("dendro", "src/models/social/event.js").Event;
const Comment = rlequire("dendro", "src/models/social/comment.js").Comment;
const uuid = require("uuid");
const DbConnection = rlequire("dendro", "src/kb/db.js").DbConnection;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const db = Config.getDBByID();
const db_social = Config.getDBByID("social");
const dbMySQL = rlequire("dendro", "src/mysql_models/index");

let Post = function (object, type, postURI, userURI, projectURI)
{
    if (!isNull(object))
    {
        if (!isNull(type) || !isNull(postURI) || !isNull(userURI) || !isNull(projectURI))
        {
            throw new Error("invalid constructor call for Post class!");
        }

        const self = this;
        self.addURIAndRDFType(object, "post", Post);
        Post.baseConstructor.call(this, object);

        self.copyOrInitDescriptors(object);
        self.ddr.numLikes = 0;

        return self;
    }

    this.typeName = type;
    this.postURI = postURI;
    this.userURI = userURI;
    this.projectURI = projectURI;
    return this;
};

Post.prototype.getComments = function (cb)
{
    var self = this;

    var query =
            "SELECT ?commentURI \n" +
            "WHERE \n" +
            "{ \n" +
            "   GRAPH [0] \n" +
            "   { \n" +
            "       ?commentURI rdf:type ddr:Comment. \n" +
            "       ?commentURI ddr:postURI [1]. \n" +
            "       ?commentURI ddr:modified ?date. \n " +
            "   } \n" +
            "} \n" +
            "ORDER BY ASC(?date) \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.ontologies.ddr.postURI.type,
                value: self.uri
            }
        ]),
        function (err, results)
        {
            if (!err)
            {
                async.mapSeries(results, function (commentInfo, callback)
                {
                    Comment.findByUri(commentInfo.commentURI, function (err, comment)
                    {
                        callback(err, comment);
                        // }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                    }, null, db_social.graphUri, null);
                }, function (err, comments)
                {
                    cb(err, comments);
                });
            }
            else
            {
                cb(true, "Error fetching children of project root folder");
            }
        });
};

Post.prototype.getNumLikes = function (cb)
{
    var self = this;

    var query =
            "SELECT ?likeURI ?userURI \n" +
            "WHERE \n" +
            "{ \n" +
            "   GRAPH [0] \n" +
            "   { \n" +
            "       ?likeURI rdf:type ddr:Like. \n" +
            "       ?likeURI ddr:postURI [1]. \n" +
            "       ?likeURI ddr:userWhoLiked ?userURI . \n" +
            "   } \n" +
            "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.ontologies.ddr.postURI.type,
                value: self.uri
            }
        ]),
        function (err, results)
        {
            if (isNull(err))
            {
                cb(err, results);
            }
            else
            {
                cb(err, "Error fetching children of project root folder");
            }
        });
};

Post.prototype.getLikes = function (cb)
{
    var self = this;
    let resultInfo;

    self.getNumLikes(function (err, likesArray)
    {
        if (!err)
        {
            if (likesArray.length)
            {
                resultInfo = {
                    postURI: self.uri, numLikes: likesArray.length, usersWhoLiked: _.pluck(likesArray, "userURI")
                };
            }
            else
            {
                resultInfo = {
                    postURI: self.uri, numLikes: 0, usersWhoLiked: "undefined"
                };
            }
            cb(null, resultInfo);
        }
        else
        {
            Logger.log("error", "Error getting likesInfo from a post");
            Logger.log("error", err);
            cb(true, "Error getting likesInfo from a post");
        }
    });
};

Post.prototype.getShares = function (cb)
{
    var self = this;

    var query =
            "SELECT ?shareURI \n" +
            "WHERE " +
            "{ \n" +
            "   GRAPH [0] \n" +
            "   { \n" +
            "       ?shareURI rdf:type ddr:Share. \n" +
            "       ?shareURI ddr:postURI [1]. \n" +
            "   } \n" +
            "} \n";

    db.connection.execute(query,
        DbConnection.pushLimitsArguments([
            {
                type: Elements.types.resourceNoEscape,
                value: db_social.graphUri
            },
            {
                type: Elements.ontologies.ddr.postURI.type,
                value: self.uri
            }
        ]),
        function (err, results)
        {
            if (!err)
            {
                async.mapSeries(results, function (shareObject, callback)
                {
                    // Share.findByUri(shareObject.shareURI, function(err, share)
                    const Resource = rlequire("dendro", "src/models/resource.js").Resource;
                    Resource.findByUri(shareObject.shareURI, function (err, share)
                    {
                        callback(false, share);
                        // }, Ontology.getAllOntologiesUris(), db_social.graphUri);
                        // }, null, db_social.graphUri, null);
                    }, null, db_social.graphUri, false, null, null);
                }, function (err, shares)
                {
                    cb(false, shares);
                });
            }
            else
            {
                cb(true, "Error shares for a post");
            }
        });
};

Post.prototype.getOwnerProject = function (callback)
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

    db.connection.execute(query,
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
        function (err, result)
        {
            if (isNull(err))
            {
                if (result instanceof Array && result.length === 1)
                {
                    const Project = rlequire("dendro", "src/models/project.js").Project;
                    Project.findByUri(result[0].uri, function (err, project)
                    {
                        callback(err, project);
                    });
                }
                else
                {
                    callback(1, "Invalid result set or no parent PROJECT found when querying for the parent project of" + self.uri);
                }
            }
            else
            {
                callback(1, "Error reported when querying for the parent PROJECT of" + self.uri + " . Error was ->" + result);
            }
        }
    );
};

Post.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableURI))
    {
        const newId = uuid.v4();
        callback(null, "/posts/" + newId);
    }
    else
    {
        callback(null, self.ddr.humanReadableURI);
    }
};

Post.prototype.saveToMySQL = function (callback)
{
    const self = this;
    dbMySQL.post_types.findAll({
        where: {
            name: self.typeName
        }
    }).then(res =>
    {
        self.typeId = res[0].dataValues.id;
        dbMySQL.posts
            .create(self)
            .then(() =>
            {
                callback(null);
                return null;
            }
            ).catch(err =>
            {
                callback(err);
                return null;
            }
            );
    });
};

Post.prototype.deleteFromMySQL = function (callback)
{
    const self = this;
    dbMySQL.post_types.findAll({
        where: {
            name: self.typeName
        }
    }).then(res =>
    {
        self.typeId = res[0].dataValues.id;
        dbMySQL.posts
            .destroy({
                where: {
                    postURI: self.postURI,
                    userURI: self.userURI,
                    typeId: self.typeId
                }
            }).then(() =>
            {
                callback(null);
                return null;
            }
            ).catch(err =>
            {
                callback(err);
                return null;
            }
            );
    });
};

Post.prototype.updateTimestamp = function (callback)
{
    const self = this;
    dbMySQL.posts.update({
        updatedAt: new Date()
    }, {
        where: { postURI: self.postURI }
    }).then(() =>
    {
        dbMySQL.timeline_post.destroy({
            where: {
                postURI: self.postURI,
                type: "ranked"
            }
        })
            .then(() =>
            {
                callback(null);
                return null;
            })
            .catch(err =>
            {
                callback(err);
                return null;
            });
    });
};

Post = Class.extend(Post, Event, "ddr:Post");

module.exports.Post = Post;
