var Config = require("../meta/config.js").Config;
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
var Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

var db = function() { return GLOBAL.db.default; }();
var db_social = function() { return GLOBAL.db.social; }();

var gfs = function() { return GLOBAL.gfs.default; }();
var async = require('async');

function Event (object)
{
    Event.baseConstructor.call(this, object);
    var self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Event";

    var now = new Date();
    self.dcterms.created = now.toISOString();

    return self;
}


/*Event.prototype.save = function (callback) {
 console.log('Event save');
 var self = this;

 self.baseConstructor.save(function (err, newEvent) {
 callback(err, newEvent);
 });
 };*/

Event = Class.extend(Event, Resource);

module.exports.Event = Event;


