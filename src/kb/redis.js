const util = require('util');
const redis = require('redis');
const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const colors = require('colors');

function RedisConnection (options, databaseNumber, id)
{
    const self = this;
    self.options = options;
    self.databaseNumber = databaseNumber;

    self.port = options.port;
    self.host = options.host;
    self.id = id;
}

RedisConnection.prototype.openConnection = function(callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(self.redis))
        {
            callback(1, "Redis connection is already open.");
        }
        else
        {
            self.redis = redis.createClient(self.options);

            const registerConnectionCallbacks = function (err) {

                /*self.redis.on('connect', function ()
                {
                    console.log('Redis client connected');
                    callback(null, self);
                });*/

                self.redis.on('ready', function ()
                {
                    console
                        .log

                        ('Redis client ready');
                    callback(null, self);
                });

                self.redis.on('error', function (err)
                {
                    const msg =
                        'Error connecting to Redis client ' + JSON.stringify(err);
                    console.log();
                    callback(err, msg);
                });
            };

            if (!isNull(self.databaseNumber))
            {
                registerConnectionCallbacks();
                self.redis.select(self.databaseNumber, function ()
                {
                    console.log("Redis client switched to database number " + self.databaseNumber);
                });
            }
            else
            {
                registerConnectionCallbacks();
            }
        }
    }
    else
    {
        callback(null, null);
    }
};

RedisConnection.prototype.put = function(resourceUri, object, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(object))
        {
            if(!isNull(self.redis))
            {
                self.redis.set(resourceUri, JSON.stringify(object), function(err, reply)
                {
                    if(!err)
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_writes)
                        {
                            console.log("[DEBUG] Saved cache record for " + resourceUri);
                        }

                        callback(null);
                    }
                    else
                    {
                        callback(1, "Unable to set value of " + resourceUri + " as " + JSON.stringify(object) + " into redis cache");
                    }
                })
            }
            else
            {
                callback(1, "Tried to save a resource into cache providing a null object!");
            }
        }
        else
        {
            callback(null, null);
        }
    }
    else
    {
        callback(null, null);
    }
};

RedisConnection.prototype.get = function(resourceUri, callback) {
    const self = this;

    if(Config.cache.active)
    {

        if(!isNull(self.redis))
        {
            if(!isNull(resourceUri))
            {
                self.redis.get(resourceUri, function(err, cachedJSON)
                {
                    if(!err)
                    {
                        if(Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            if(!isNull(cachedJSON))
                            {
                                console.log("Cache HIT on " + resourceUri);
                            }
                            else
                            {
                                console.log("Cache MISS on " + resourceUri);
                            }
                        }

                        callback(null, JSON.parse(cachedJSON));
                    }
                    else
                    {
                        callback(err, "Unable to retrieve value of " + resourceUri + " as " + JSON.stringify(object) + " from redis cache");
                    }
                });
            }
            else
            {
                callback(1, "Tried to fetch a resource from cache providing a null resourceUri!");
            }
        }
        else
        {
            callback(1, "Must open connection to Redis first!");
        }
    }
    else
    {
        callback(null, null);
    }
};

RedisConnection.prototype.delete = function(resourceUriOrArrayOfResourceUris, callback) {
    const self = this;

    if(Config.cache.active)
    {
        if(!isNull(self.redis))
        {
            if(!isNull(resourceUriOrArrayOfResourceUris))
            {
                self.redis.del(resourceUriOrArrayOfResourceUris, function (err)
                {
                    if(!err)
                    {
                        if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                        {
                            console.log("[DEBUG] Deleted cache records for " + JSON.stringify(resourceUriOrArrayOfResourceUris));
                        }

                        callback(null, null);
                    }
                    else
                    {
                        const msg = "Unable to delete resource " + resourceUriOrArrayOfResourceUris + " from redis cache. " + err;
                        console.log(msg);
                        callback(err, msg);
                    }
                });
            }
            else
            {
                callback(1, "Tried to delete resources in cache with null uri array");
            }
        }
        else
        {
            callback(1, "Must open connection to Redis first!");
        }
    }
    else
    {
        callback(null, null);
    }
};

RedisConnection.prototype.deleteAll = function(callback) {
    const self = this;

    if(Config.cache.active)
    {

        if(!isNull(self.redis))
        {
            self.redis.flushdb(function (err)
            {
                if(!err)
                {
                    if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                    {
                        console.log("[DEBUG] Deleted ALL cache records");
                    }

                    callback(null);
                }
                else
                {
                    const msg = "Unable to delete database number " + self.databaseNumber + " : " + JSON.stringify(err);
                    console.log(msg);
                    callback(err, msg);
                }
            });
        }
        else
        {
            callback(1, "Must open connection to Redis first!");
        }
    }
    else
    {
        callback(null, null);
    }

};

RedisConnection.default = {};

module.exports.RedisConnection = RedisConnection;

