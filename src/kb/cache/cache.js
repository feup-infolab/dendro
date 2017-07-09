const util = require('util');
const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const RedisCache = require(Config.absPathInSrcFolder("/kb/cache/caches/redis.js")).RedisCache;
const MongoDBCache = require(Config.absPathInSrcFolder("/kb/cache/caches/mongodb.js")).MongoDBCache;
const colors = require('colors');
const async = require('async');

const Cache = function()
{

};

Cache.initConnections = function(callback)
{
    const self = this;
    const _ = require('underscore');

    let keys = _.filter(Object.keys(global.db), function(key){
        return global.db.hasOwnProperty(key);
    });

    async.map(keys,
        function(key, callback) {
            const dbConfig = global.db[key];

            if(!isNull(dbConfig.cache))
            {
                const cacheType = dbConfig.cache.type;
                const cacheId = dbConfig.cache.id;
                const graphUri = dbConfig.graphUri;

                if(!isNull(graphUri))
                {
                    if(!isNull(cacheId))
                    {
                        switch(cacheType)
                        {
                            case MongoDBCache.type : {
                                let mongoCacheConfig = Config.cache.mongodb.instances[cacheId];
                                if(Config.cache.mongodb.active && !isNull(mongoCacheConfig))
                                {
                                    const newMongoCacheConnection = new MongoDBCache(mongoCacheConfig);

                                    newMongoCacheConnection.openConnection(function(err, mongoDBConnection) {
                                        if(!isNull(err))
                                        {
                                            throw new Error("[ERROR] Unable to connect to MongoDB instance with ID: " + mongoDBConnection.id + " running on " + mongoDBConnection.options.host + ":" + mongoDBConnection.options.port + " : " + err.message);
                                        }
                                        else
                                        {
                                            console.log("[OK] Connected to MongoDB cache service with ID : " + newMongoCacheConnection.id + " running on " +  newMongoCacheConnection.host + ":" + newMongoCacheConnection.port);

                                            newMongoCacheConnection.deleteAll(function(err, result){
                                                if(!err)
                                                {
                                                    self.caches[cacheId] = newMongoCacheConnection;
                                                    return callback(null, newMongoCacheConnection);
                                                }
                                                else
                                                {
                                                    throw new Error("[ERROR] Unable to delete all cache records on MongoDB instance \""+ instance.id +"\" during bootup:\n" + JSON.stringify(result));
                                                }
                                            });
                                        }
                                    });
                                }

                                break;
                            }
                            case RedisCache.type : {
                                let redisCacheConfig = Config.cache.redis.instances[cacheId];
                                if(Config.cache.redis.active && !isNull(redisCacheConfig))
                                {
                                    const newRedisCacheConnection = new RedisCache(redisCacheConfig);

                                    newRedisCacheConnection.openConnection(function(err, redisConnection) {
                                        if(!isNull(err))
                                        {
                                            throw new Error("[ERROR] Unable to connect to Redis instance with ID: " + instance.id + " running on " + instance.options.host + ":" + instance.options.port + " : " + err.message)
                                        }
                                        else {
                                            console.log("[OK] Connected to Redis cache service with ID : " + redisConnection.id + " running on " + redisConnection.host + ":" + redisConnection.port);


                                            newRedisCacheConnection.deleteAll(function (err, result) {
                                                if (!err) {
                                                    console.log("[INFO] Deleted all cache records on Redis instance " + redisConnection.id);
                                                    self.caches[cacheId] = redisConnection;
                                                    return callback(null, redisConnection);
                                                }
                                                else
                                                {
                                                    throw new Error("[ERROR] Unable to delete all cache records on Redis instance \"" + instance.id + "\" during bootup");
                                                }
                                            });
                                        }
                                    });
                                }
                                else
                                {
                                    return callback(null, "Redis cache is not active or there is no redis cache config active with ID " + cacheId);
                                }

                                break;
                            }
                            default:
                            {
                                throw new Error("Unrecognized cache type " + cacheType + ". Please review your deployment_configs.json file.");
                            }
                        }
                    }
                    else
                    {
                        throw new Error("Cache was set for graph " + graphUri + " but no cache id was configured. Please review the config.js file.");
                    }
                }
                else
                {
                    throw new Error("There was an error parametrizing the caches for graph " + JSON.stringify(db) + " .This is a bug. Please review the config.json file.");
                }
            }
            else
            {
                callback(null);
            }
        },
        function(err, results) {
            if(!err)
            {
                console.log("[INFO] All Cache instances are up and running!");
                return callback(null);
            }
            else
            {
                throw new Error("[ERROR] Unable to setup some cache instances." + JSON.stringify(results));
            }
        }
    );
};

Cache.closeConnections = function(cb)
{
    let self = this;

    async.map(Object.keys(self.caches), function(cacheKey, cb){
        if(self.caches.hasOwnProperty(cacheKey))
        {
            self.caches[cacheKey].closeConnection(cb);
        }
        else
        {
            cb(null, null);
        }
    }, function(err, results){
        cb(err, results);
    });
};

Cache.get = function(cacheId)
{
    if(isNull(cacheId))
    {
        return Cache.caches['default'];
    }
    else if(!isNull(Cache.caches[cacheId]))
    {
        return Cache.caches[cacheId];
    }
    else 
    {
        throw new Error("Invalid cache identifier : " + cacheId);
    }
};

Cache.caches = {};

module.exports.Cache = Cache;

