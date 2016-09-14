var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInProject("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInProject("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInProject("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInProject("/models/meta/descriptor.js")).Descriptor;

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');

function Comment (object)
{
    Comment.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Comment";

    return self;
}

Comment = Class.extend(Comment, Event);

module.exports.Comment = Comment;


