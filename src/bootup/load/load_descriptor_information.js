const async = require("async");
const fs = require("fs");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Descriptor = require(Pathfinder.absPathInSrcFolder("/models/meta/descriptor.js")).Descriptor;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const loadDescriptorInformation = function (app, callback)
{
    Logger.log_boot_message("info", "Checking ontology and descriptor parametrizations...");
    Descriptor.validateDescriptorParametrization(function (err, result)
    {
        if (isNull(err))
        {
            Logger.log_boot_message("success", "All ontologies and descriptors seem correctly set up.");
            return callback(null);
        }
        return callback("[ERROR] Errors were detected while checking the configuration of descriptors and/or ontologies in the system.");
    });
};

module.exports.loadDescriptorInformation = loadDescriptorInformation;
