const util = require('util');
const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const colors = require('colors');
const MongoClient = require('mongodb').MongoClient;

function MongoDBCache (options)
{
    const self = this;

    self.port = options.port;
    self.host = options.host;
    self.database = options.database;
    self.collection = options.collection;
    self.id = options.id;

    self.hits = 0;
    self.misses = 0;
}

MongoDBCache.prototype.getHitRatio = function ()
{
    var self = this;
    if ((self.hits + self.misses) !== 0)
    {
        return self.hits / (self.hits + self.misses);
    }
    return 'No cache accesses recorded';
};

MongoDBCache.prototype.open = function (callback)
{
    const self = this;

    if (!isNull(self.client))
    {
        return callback(1, 'MongoDB connection is already open.');
    }
    const slug = require('slug');
    const url = 'mongodb://' + self.host + ':' + self.port + '/' + slug(self.database, '_');
    MongoClient.connect(url, function (err, db)
    {
        if (isNull(err))
        {
            self.client = db;
            self.client.collection(self.collection).ensureIndex(
                'uri',
                function (err, result)
                {
                    if (isNull(err))
                    {
                        callback(null, self);
                    }
                    else
                    {
                        callback(err, self);
                    }
                }
            );
        }
        else
        {
            callback(err, db);
        }
    });
};

MongoDBCache.prototype.close = function (cb)
{
    const self = this;
    if (!isNull(self.client))
    {
        self.client.close(function (err, result)
        {
            cb(err, result);
        });
    }
    else
    {
        cb(null);
    }
};

MongoDBCache.prototype.put = function (resourceUri, object, callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(object))
        {
            if (!isNull(self.client))
            {
                self.client.collection(self.collection).update(
                    {
                        uri: resourceUri
                    },
                    object,
                    {
                        upsert: false,
                        w: 1,
                        j: true
                    },
                    function (err, results)
                    {
                        if (isNull(err))
                        {
                            if (results.result.nModified === 0)
                            {
                                self.client.collection(self.collection).insert(
                                    object,
                                    {
                                        w: 1,
                                        j: true
                                    },
                                    function (err, results)
                                    {
                                        if (isNull(err))
                                        {
                                            if (Config.debug.active && Config.debug.cache.log_cache_writes)
                                            {
                                                console.log('[DEBUG] Saved new cache record for ' + resourceUri);
                                            }

                                            return callback(null);
                                        }

                                        return callback(err, 'Unable to insert new cache record  for ' + resourceUri + ' as ' + JSON.stringify(object) + ' into mongodb cache. Error : ' + JSON.stringify(err));
                                    });
                            }
                            else
                            {
                                if (Config.debug.active && Config.debug.cache.log_cache_writes)
                                {
                                    console.log('[DEBUG] Updated cache record for ' + resourceUri);
                                }

                                return callback(null);
                            }
                        }
                        else
                        {
                            return callback(err, 'Unable to update cache record of ' + resourceUri + ' as ' + JSON.stringify(results) + ' into monogdb cache. Error : ' + JSON.stringify(err));
                        }
                    });
            }
            else
            {
                return callback(1, 'Tried to save a resource into cache providing a null object!');
            }
        }
        else
        {
            return callback(null, null);
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.getByQuery = function (query, callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(query))
            {
                const cursor = self.client.collection(self.collection).find(query).sort({'ddr.modified': -1 });

                cursor.next(function (err, result)
                {
                    if (Config.debug.active && Config.debug.database.log_all_cache_queries)
                    {
                        console.log('Cache Query:\n');
                        console.log(JSON.stringify(query, null, 2));
                    }

                    if (isNull(err))
                    {
                        if (isNull(result))
                        {
                            if (Config.cache.active && Config.debug.cache.log_cache_hits)
                            {
                                console.log('Cache MISS on ' + JSON.stringify(query));
                            }

                            self.misses++;
                            return callback(null, null);
                        }
                        if (Config.cache.active && Config.debug.cache.log_cache_hits)
                        {
                            console.log('Cache HIT on ' + JSON.stringify(query) + '\n');
                            console.log('Cached : \n ' + JSON.stringify(result, null, 4));
                        }

                        self.hits++;
                        return callback(null, result);
                    }
                    console.error('Error running query: ' + JSON.stringify(query, null, 4));
                    console.error(err.stack);
                    return callback(err, 'Unable to execute query ' + JSON.stringify(query) + ' from mongodb cache.');

                    cursor.close();
                });
            }
            else
            {
                return callback(1, 'Tried to fetch a resource from cache ' + JSON.stringify(self) + ' providing a null resourceUri!');
            }
        }
        else
        {
            return callback(1, 'Must open connection to MongoDB cache ' + JSON.stringify(self) + 'first!');
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.get = function (resourceUri, callback)
{
    const self = this;
    self.getByQuery({ uri: resourceUri }, function (err, result)
    {
        if (isNull(err))
        {
            if (!isNull(result))
            {
                callback(null, result);
            }
            else
            {
                return callback(null, null);
            }
        }
        else
        {
            return callback(err, result);
        }
    });
};

MongoDBCache.prototype.delete = function (resourceUriOrArrayOfResourceUris, callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(resourceUriOrArrayOfResourceUris))
            {
                let filterObject;
                if (resourceUriOrArrayOfResourceUris instanceof Array && resourceUriOrArrayOfResourceUris.length > 0)
                {
                    filterObject = {
                        $or: []
                    };

                    for (let i = 0; i < resourceUriOrArrayOfResourceUris.length; i++)
                    {
                        filterObject.$or.push({
                            uri: resourceUriOrArrayOfResourceUris[i]
                        });
                    }
                }
                else if (typeof resourceUriOrArrayOfResourceUris === 'string')
                {
                    filterObject = {
                        uri: resourceUriOrArrayOfResourceUris
                    };
                }

                self.client.collection(self.collection).remove(
                    filterObject,
                    function (err)
                    {
                        if (isNull(err))
                        {
                            if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                            {
                                console.log('[DEBUG] Deleted mongodb cache records for ' + JSON.stringify(resourceUriOrArrayOfResourceUris));
                            }

                            return callback(null, null);
                        }

                        const msg = 'Unable to delete resource ' + resourceUriOrArrayOfResourceUris + ' from MongoDB cache ' + JSON.stringify(self.id) + '\n' + err;
                        console.log(msg);
                        return callback(err, msg);
                    }
                );
            }
            else
            {
                return callback(1, 'Tried to fetch a resource from cache ' + JSON.stringify(self) + ' providing a null resourceUri array!');
            }
        }
        else
        {
            return callback(1, 'Must open connection to MongoDB cache ' + JSON.stringify(self) + 'first!');
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.deleteByQuery = function (queryObject, callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            self.client.collection(self.collection)
                .remove(
                    queryObject,
                    function (err)
                    {
                        if (isNull(err))
                        {
                            if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                            {
                                console.log('[DEBUG] Deleted mongodb cache records for ' + JSON.stringify(queryObject));
                            }

                            return callback(null, null);
                        }

                        // TODO this is a hack for running tests, because mongodb connectons should never be closed at this time!!
                        const msg = 'Unable to delete resources via query from MongoDB cache\n';
                        if (err.message !== 'server instance pool was destroyed')
                        {
                            console.error(JSON.stringify(err, null, 4));
                            console.error(JSON.stringify(queryObject, null, 4));
                            return callback(err, msg);
                        }

                        return callback(null, msg);
                    });
        }
        else
        {
            return callback(1, 'Must open connection to MongoDB cache ' + JSON.stringify(self) + 'first!');
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.deleteAlByType = function (typeOrTypesArray, callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            if (!isNull(typeOrTypesArray))
            {
                let queryObject;
                if (typeOrTypesArray instanceof Array)
                {
                    queryObject = {
                        rdf:
            {
                type:
              {
                  $and: []
              }
            }
                    };

                    for (let i = 0; i < typeOrTypesArray.length; i++)
                    {
                        queryObject.rdf.type.$and.push(typeOrTypesArray[i]);
                    }
                }
                else if (typeof typeOrTypesArray === 'string')
                {
                    queryObject = {
                        rdf: {
                            type: typeOrTypesArray
                        }
                    };
                }

                self.deleteByQuery(queryObject, callback);
            }
            else
            {
                return callback(1, 'Tried to fetch a resource from cache ' + JSON.stringify(self) + ' providing a null resourceUri array!');
            }
        }
        else
        {
            return callback(1, 'Must open connection to MongoDB cache ' + JSON.stringify(self) + 'first!');
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.prototype.deleteAll = function (callback)
{
    const self = this;

    if (Config.cache.active)
    {
        if (!isNull(self.client))
        {
            self.client.collection(self.collection).drop(function (err)
            {
                if (isNull(err) || err.message === 'ns not found')
                {
                    if (Config.debug.active && Config.debug.cache.log_cache_deletes)
                    {
                        console.log('[DEBUG] Deleted ALL cache records');
                    }

                    return callback(null);
                }
                const msg = 'Unable to delete collection ' + self.collection + ' : ' + JSON.stringify(err);
                console.log(msg);
                return callback(err, msg);
            });
        }
        else
        {
            return callback(1, 'Must open connection to MongoDB cache ' + JSON.stringify(self) + 'first!');
        }
    }
    else
    {
        return callback(null, null);
    }
};

MongoDBCache.default = {};

MongoDBCache.type = 'mongodb';

module.exports.MongoDBCache = MongoDBCache;
