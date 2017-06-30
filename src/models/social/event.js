const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;
const Descriptor = require(Config.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;

const db = function () {
    return global.db.default;
}();
function Event (object)
{
    Event.baseConstructor.call(this, object, Event);
    const self = this;

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.dcterms.created = now.toISOString();

    return self;
}


/*Event.prototype.save = function (callback) {
 console.log('Event save');
 var self = this;

 self.baseConstructor.save(function (err, newEvent) {
 return callback(err, newEvent);
 });
 };*/

Event = Class.extend(Event, Resource, "ddr:Event");

module.exports.Event = Event;


