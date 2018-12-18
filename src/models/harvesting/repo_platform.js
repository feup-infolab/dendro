const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const async = require("async");

function RepositoryPlatform (object = {})
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
