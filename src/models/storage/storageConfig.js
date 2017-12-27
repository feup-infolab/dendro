const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Resource = require(Pathfinder.absPathInSrcFolder("models/resource.js")).Resource;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;

function StorageConfig (object)
{
    const self = this;
    self.addURIAndRDFType(object, "storageConfig", StorageConfig);
    StorageConfig.baseConstructor.call(this, object);

    self.copyOrInitDescriptors(object);

    const now = new Date();

    self.ddr.created = now.toISOString();

    return self;
}

StorageConfig = Class.extend(StorageConfig, Resource, "ddr:StorageConfig");

module.exports.StorageConfig = StorageConfig;

