const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const db = Config.getDBByID();

function Event (object)
{
    Event.baseConstructor.call(this, object);
    const self = this;

    self.copyOrInitDescriptors(object);

    const now = new Date();
    self.ddr.created = now.toISOString();

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


