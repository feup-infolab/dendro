const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
const Resource = require(Pathfinder.absPathInSrcFolder("/models/resource.js")).Resource;

const async = require("async");

function RepositoryPlatform (object)
{
    const self = this;
    self.addURIAndRDFType(object, "repo_platform", RepositoryPlatform);
    RepositoryPlatform.baseConstructor.call(this, object);
    return self;
}

RepositoryPlatform.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.handle))
    {
        callback(1, "Unable to get human readable uri for " + self.uri + " because it has no ddr.handle property.");
    }
    else
    {
        callback(null, "/repository_platform/" + self.ddr.handle);
    }
};

RepositoryPlatform = Class.extend(RepositoryPlatform, Resource, "ddr:RepositoryPlatform");

module.exports.RepositoryPlatform = RepositoryPlatform;
