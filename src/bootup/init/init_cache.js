const fs = require('fs');

const Pathfinder = global.Pathfinder;
const Cache = require(Pathfinder.absPathInSrcFolder('kb/cache/cache.js')).Cache;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;
const Logger = require(Pathfinder.absPathInSrcFolder('utils/logger.js')).Logger;

const initCache = function (app, callback)
{
    if (Config.cache.active)
    {
        const Cache = require(Pathfinder.absPathInSrcFolder('/kb/cache/cache.js')).Cache;
        Cache.initConnections(function (err, result)
        {
            callback(err);
        }, Config.startup.clear_caches);
    }
    else
    {
        Logger.log_boot_message('info', 'Cache not active in deployment configuration. Continuing Dendro startup without connecting to any cache servers.');
        return callback(null);
    }
};

module.exports.initCache = initCache;
