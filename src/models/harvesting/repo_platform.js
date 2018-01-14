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

    if (isNull(self.ddr.humanReadableURI))
    {
        const slug = require("slug");

        if (!isNull(object.ddr))
        {
            if (isNull(object.ddr.humanReadableURI))
            {
                if (!isNull(self.ddr.handle) && !isNull(self.dcterms.title))
                {
                    self.ddr.humanReadableURI = "/repository_platform/" + object.ddr.handle;
                }
                else
                {
                    const error = "Unable to create an external repository resource without specifying its ddr:handle and its dcterms:title";
                    Logger.log("error", error);
                    return {error: error};
                }
            }
        }
    }

    return self;
}

RepositoryPlatform = Class.extend(RepositoryPlatform, Resource, "ddr:RepositoryPlatform");

module.exports.RepositoryPlatform = RepositoryPlatform;
