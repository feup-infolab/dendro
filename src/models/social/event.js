const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const db = function () {
    return GLOBAL.db.default;
}();
const db_social = function () {
    return GLOBAL.db.social;
}();

const gfs = function () {
    return GLOBAL.gfs.default;
}();
const async = require('async');

function Event (object)
{
    Event.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    self.rdf.type = "ddr:Event";

    const now = new Date();
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


