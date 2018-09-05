const fs = require("fs");

const rlequire = require("rlequire");
const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const initCache = function (app, callback)
{
    const Cache = rlequire("dendro", "src/kb/cache/cache.js").Cache;
    Cache.initConnections(function (err, result)
    {
        callback(err);
    });
};

module.exports.initCache = initCache;
