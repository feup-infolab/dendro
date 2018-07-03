const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

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

/* Event.prototype.save = function (callback) {
 Logger.log('Event save');
 var self = this;

 self.baseConstructor.save(function (err, newEvent) {
 return callback(err, newEvent);
 });
 }; */

Event = Class.extend(Event, Resource, "ddr:Event");

module.exports.Event = Event;
