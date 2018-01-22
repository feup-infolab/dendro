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
        self.ddr.humanReadableURI = db.baseURI + "/administrator/" + self.ddr.username;
    }

    return self;
}

Administrator = Class.extend(Administrator, User, "ddr:Administrator");

module.exports.Administrator = Administrator;
