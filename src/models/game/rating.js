var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var util = require('util');
var async = require('async');
var _ = require('underscore');
var path = require('path');
var uuid = require('node-uuid');

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

function Rating (object)
{
    Rating.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/rating/"+uuid.v4();
    }

    self.rdf.type = "gm:Rating";

    return self;
}

Rating.prototype.update = function(score, callback) {

    var self=this;

    self.gm.score=score;
    self.save(function(err, result)
    {
        callback(err, result);
    });

}
Rating.prefixedRDFType = "gm:Rating";

Rating = Class.extend(Rating, Resource);

module.exports.Rating = Rating;