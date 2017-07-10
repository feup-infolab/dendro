const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const RedisCache = require(Pathfinder.absPathInSrcFolder("/kb/cache/caches/redis.js")).RedisCache;
const MongoDBCache = require(Pathfinder.absPathInSrcFolder("/kb/cache/caches/mongodb.js")).MongoDBCache;
const colors = require('colors');
const async = require('async');

const Cache = function()
{

};

Cache.initConnections = function(callback)
{
    const self = this;
    const _ = require('underscore');

    let keys = _.filter(Object.keys(Config.db), function(key){
        return Config.db.hasOwnProperty(key);
    });

    async.map(keys,
        function(key, callback) {
            const dbConfig = Config.db[key];

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
                                            throw new Error("[ERROR] Unable to connect to MongoDB instance with ID: " + mongoCacheConfig.options.id + " running on " + mongoCacheConfig.options.host + ":" + mongoCacheConfig.options.port + " : " + err.message);
                                        }
                                        else
                                        {
                                            console.log("[OK] Connected to MongoDB cache service with ID : " + mongoDBConnection.id + " running on " +  mongoDBConnection.host + ":" + mongoDBConnection.port);

                                            newMongoCacheConnection.deleteAll(function(err, result){
                                                if(!err)
                                                {
                                                    Cache.caches[cacheId] = newMongoCacheConnection;
                                                    Cache.cachesByGraphUri[graphUri] = newMongoCacheConnection;

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

                                    newRedisCacheConnection.openConnection(function(err, newRedisConnection) {
                                        if(!isNull(err))
                                        {
                                            throw new Error("[ERROR] Unable to connect to Redis instance with ID: " + redisCacheConfig.id + " running on " + redisCacheConfig.options.host + ":" + redisCacheConfig.options.port + " : " + err.message)
                                        }
                                        else {
                                            console.log("[OK] Connected to Redis cache service with ID : " + newRedisConnection.id + " running on " + newRedisConnection.host + ":" + newRedisConnection.port);


                                            newRedisCacheConnection.deleteAll(function (err, result) {
                                                if (!err) {
                                                    console.log("[INFO] Deleted all cache records on Redis instance " + newRedisConnection.id);
                                                    Cache.caches[cacheId] = newRedisConnection;
                                                    Cache.cachesByGraphUri[graphUri] = newRedisConnection;
                                                    return callback(null, newRedisConnection);
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

Cache.getByID = function(cacheId)
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

Cache.getByGraphUri = function(graphUri)
{
    if(isNull(graphUri))
    {
        return Cache.caches['default'];
    }
    else if(!isNull(Cache.cachesByGraphUri[graphUri]))
    {
        return Cache.cachesByGraphUri[graphUri];
    }
    else
    {
        throw new Error("Invalid graph uri when fetching cache : " + graphUri);
    }
};

Cache.caches = {};
Cache.cachesByGraphUri = {};

module.exports.Cache = Cache;

