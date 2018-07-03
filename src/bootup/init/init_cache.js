const fs = require("fs");

const rlequire = require("rlequire");
const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const initCache = function (app, callback)
{
    if (Config.cache.active)
    {
        const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
        Cache.initConnections(function (err, result)
        {
            callback(err);
        });
    }
    else
    {
        Logger.log_boot_message("Cache not active in deployment configuration. Continuing Dendro startup without connecting to any cache servers.");
        return callback(null);
    }
};

module.exports.initCache = initCache;
