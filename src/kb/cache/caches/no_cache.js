const rlequire = require("rlequire");

function NoCache (options)
{
}

NoCache.prototype.open = function (callback)
{
    return callback(null, null);
};

NoCache.prototype.close = function (cb)
{
    cb(null, null);
};

NoCache.prototype.put = function (resourceUri, object, callback)
{
    callback(null, null);
};

NoCache.prototype.get = function (resourceUri, callback)
{
    return callback(null, null);
};

NoCache.prototype.delete = function (resourceUriOrArrayOfResourceUris, callback)
{
    return callback(null, null);
};

NoCache.prototype.deleteAll = function (callback)
{
    return callback(null, null);
};

NoCache.prototype.deleteAllByType = function (type, callback)
{
    return callback(null, null);
};

NoCache.prototype.getByQuery = function (query, callback)
{
    return callback(null, null);
};

NoCache.default = {};

NoCache.type = "no_cache";

module.exports.NoCache = NoCache;
