const rlequire = require("rlequire");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const async = require("async");
const path = require("path");
const _ = require("underscore");

class IndexConnection
{
    constructor (options)
    {
        const self = this;
        self.id = options.id;
        self.short_name = options.short_name;
        self.uri = options.uri;
        self._indexIsOpen = false;

        return self;
    }

    static get (indexKey)
    {
        const self = this;
        const index = self._all[indexKey];
        if (!isNull(index))
        {
            return index;
        }

        Logger.log("warn", "Index parametrization does not exist for key " + indexKey);
        return null;
    }

    static getByGraphUri (graphUri)
    {
        const self = this;
        if (isNull(self._indexesByUri))
        {
            self._indexesByUri = {};
        }

        if (!isNull(self._indexesByUri[graphUri]))
        {
            return self._indexesByUri[graphUri];
        }

        if (!isNull(graphUri))
        {
            const connectionKey = _.find(Object.keys(self._all), function (key)
            {
                const searchConnection = self._all[key];
                return searchConnection.uri === graphUri;
            });
            if (isNull(connectionKey))
            {
                Logger.log("warn", "Invalid index connection URI " + graphUri + " !");
            }
            else
            {
                const connection = self._all[connectionKey];
                self._indexesByUri[graphUri] = connection;
                return connection;
            }
        }
        else
        {
            return self.getDefault();
        }
    }

    static getDefault ()
    {
        const self = this;
        return self.get("dendro_graph");
    }

    static createAllIndexes (callback, deleteIfExists)
    {
        const self = this;
        async.mapSeries(Object.keys(self._all), function (key, cb)
        {
            self._all[key].createNewIndex(cb, deleteIfExists);
        }, function (err, results)
        {
            callback(err, results);
        });
    }

    static destroyAllIndexes (callback)
    {
        const self = this;
        async.mapSeries(Object.keys(self._all), function (key, cb)
        {
            self._all[key].deleteIndex(cb);
        }, function (err, results)
        {
            callback(err, results);
        });
    }

    static closeConnections (cb)
    {
        const self = this;
        async.mapSeries(Object.keys(self._all), function (key, cb)
        {
            if (self._all[key] instanceof self)
            {
                self._all[key].close(cb);
            }
        }, function (err, results)
        {
            cb(err, results);
        });
    }
}

module.exports.IndexConnection = IndexConnection;

