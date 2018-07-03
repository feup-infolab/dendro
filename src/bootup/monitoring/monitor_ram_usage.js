const path = require("path");
const async = require("async");
const fs = require("fs");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const monitorRAMUsage = function (app, callback)
{
    if (Config.debug.diagnostics.ram_usage_reports)
    {
        setInterval(function ()
        {
            const pretty = require("prettysize");
            Logger.log("[" + Config.version.name + "] RAM Usage : " + pretty(process.memoryUsage().rss)); // log memory usage
            if (typeof gc === "function")
            {
                gc();
            }
        }, 2000);
    }

    callback(null);
};

module.exports.monitorRAMUsage = monitorRAMUsage;
