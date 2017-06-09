var util = require('util');
var redis = require('redis');
var Config = function() { return GLOBAL.Config; }();
var colors = require('colors');

function RedisConnection (options, databaseNumber, id)
{
    var self = this;
    self.options = options;
    self.databaseNumber = databaseNumber;

    self.port = options.port;
    self.host = options.host;
    self.id = id;
}

RedisConnection.prototype.openConnection = function(callback) {
    var self = this;

    if(Config.cache.active)
    {
        if(self.redis != null)
        {
            callback(1, "Redis connection is already open.");
        }
        else
        {
            self.redis = redis.createClient(self.options);

            var registerConnectionCallbacks = function (err)
            {
                /*self.redis.on('connect', function ()
                {
                    console.log('Redis client connected');
                    callback(null, self);
                });*/

                self.redis.on('ready', function ()
                {
                    console.log('Redis client ready');
                    callback(null, self);
                });

                self.redis.on('error', function (err)
                {
                    var msg = 'Error connecting to Redis client ' + JSON.stringify(err);
                    console.log();
                    callback(err, msg);
                });
            };

            if (self.databaseNumber != null)
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
    var self = this;

    if(Config.cache.active)
    {
        if(object != null)
        {
            if(self.redis != null)
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
    var self = this;

    if(Config.cache.active)
    {

        if(self.redis != null)
        {
            if(resourceUri != null)
            {
                self.redis.get(resourceUri, function(err, cachedJSON)
                {
                    if(!err)
                    {
                        if(Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            if(cachedJSON != null)
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
    var self = this;

    if(Config.cache.active)
    {
        if(self.redis != null)
        {
            if(resourceUriOrArrayOfResourceUris != null)
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
                        var msg = "Unable to delete resource " + resourceUriOrArrayOfResourceUris  + " from redis cache. " + err;
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
    var self = this;

    if(Config.cache.active)
    {

        if(self.redis != null)
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
                    var msg = "Unable to delete database number " + self.databaseNumber + " : " + JSON.stringify(err);
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

