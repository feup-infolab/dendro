const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;

const db = Config.getDBByID();

function Administrator (object)
{
    const self = this;

    self.addURIAndRDFType(object, "administrator", Administrator);

    Administrator.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    if (isNull(self.ddr.humanReadableURI))
    {

    }

    return self;
}

Administrator.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.username))
    {
        callback(1, "Unable to get human readable uri for " + self.uri + " because it has no ddr.username property.");
    }
    else
    {
        callback(null, "/administrator/" + self.ddr.username);
    }
};

Administrator = Class.extend(Administrator, User, "ddr:Administrator");

module.exports.Administrator = Administrator;
