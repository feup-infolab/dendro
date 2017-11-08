const path = require("path");
const async = require("async");
const fs = require("fs");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const monitorRAMUsage = function (app, callback)
{
    if (Config.debug.diagnostics.ram_usage_reports)
    {
        setInterval(function ()
        {
            const pretty = require("prettysize");
            console.log("[" + Config.version.name + "] RAM Usage : " + pretty(process.memoryUsage().rss)); // log memory usage
            if (typeof gc === "function")
            {
                gc();
            }
        }, 2000);
    }

    callback(null);
};

module.exports.monitorRAMUsage = monitorRAMUsage;
