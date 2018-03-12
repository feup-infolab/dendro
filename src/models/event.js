const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
//const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
//const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const mysql = Config.getMySQLByID();

let Event = function (object)
{
    const self = this;
    //self.addURIAndRDFType(object, "Event", Event);
    //Event.baseConstructor.call(this, object);
    //self.copyOrInitDescriptors(object);
    return self;
};

Event.create = function (object, callback)
{
    let self = new Event(object);
    return callback(null, self);

    /*if (isNull(self.ddr.humanReadableURI))
    {
        self.getHumanReadableUri(function (err, uri)
        {
            self.ddr.humanReadableURI = uri;
            return callback(null, self);
        });
    }
    else
    {
        return callback(null, self);
    }*/
};

Event.prototype.saveToMySQL = function (callback)
{
    const self = this;
    console.log(self);
    mysql.sequelize.events.create(self).then(() => {
        console.log("top");
        return callback(null);
    }).catch(err => {
        console.log("nao top " + err);
        return callback(err);
    });
};


//Event = Class.extend(Event, Resource, "ddr:Event");

module.exports.Event = Event;