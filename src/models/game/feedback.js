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

function Feedback (object)
{
    Feedback.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    if(self.uri == null)
    {
        self.uri = db.baseURI+"/Feedback/"+uuid.v4();
    }

    self.rdf.type = "gm:Feedback";

    return self;
}

Feedback.prefixedRDFType = "gm:Feedback";

Feedback = Class.extend(Feedback, Resource);

module.exports.Feedback = Feedback;