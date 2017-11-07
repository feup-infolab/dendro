const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const Event = require(Pathfinder.absPathInSrcFolder('/models/social/event.js')).Event;
const uuid = require('uuid');

function Like (object)
{
    const self = this;
    self.addURIAndRDFType(object, 'like', Like);
    Like.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const newId = uuid.v4();

    if (isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = Config.baseUri + '/likes/' + newId;
    }

    return self;
}

Like = Class.extend(Like, Event, 'ddr:Like');

module.exports.Like = Like;
