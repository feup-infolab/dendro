const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const resource = require(Pathfinder.absPathInSrcFolder("models/resoucer.js")).Resource;
const Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;


function StorageConfig (object) {

    StorageConfig.baseConstructor.call(this,object);
    const self = this;

    self.copyOrInitDescriptors(object);

    const now = new Date();

    self.ddr.created = now.toISOString();

    return self;
}


StorageConfig = Class.extend(StorageConfig, Resource, "ddr:StorageConfig");

module.exports.StorageConfig = StorageConfig;


