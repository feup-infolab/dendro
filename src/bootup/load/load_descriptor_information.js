const async = require("async");
const fs = require("fs");

const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const loadDescriptorInformation = function (app, callback)
{
    Logger.log_boot_message("Checking ontology and descriptor parametrizations...");
    Descriptor.validateDescriptorParametrization(function (err, result)
    {
        if (isNull(err))
        {
            Logger.log_boot_message("All ontologies and descriptors seem correctly set up.");
            return callback(null);
        }
        return callback("[ERROR] Errors were detected while checking the configuration of descriptors and/or ontologies in the system.");
    });
};

module.exports.loadDescriptorInformation = loadDescriptorInformation;
