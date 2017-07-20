const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const User = require(Pathfinder.absPathInSrcFolder("models/user.js")).User;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;

const db = Config.getDBByID();

function Administrator (object)
{
    Administrator.baseConstructor.call(this, object, User);
    const self = this;

    if(isNull(self.uri))
    {
        if(isNull(object.uri))
        {
            const uuid = require('uuid');
            self.uri = "/r/administrator/" + uuid.v4();
        }
        else
        {
            self.uri = object.uri;
        }
    }

    self.copyOrInitDescriptors(object);


    if(isNull(self.ddr.humanReadableURI))
    {
        self.ddr.humanReadableURI = db.baseURI+"/administrator/"+self.ddr.username;
    }

    return self;
}

Administrator = Class.extend(Administrator, User, "ddr:Administrator");

module.exports.Administrator  = Administrator;