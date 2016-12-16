var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

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


