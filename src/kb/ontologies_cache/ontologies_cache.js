const util = require("util");
const async = require("async");
const path = require("path");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const colors = require("colors");
const MongoClient = require('mongodb').MongoClient;
const slug = require('slug');

const OntologiesCache = function(options)
{
    const self = this;

    self.port = options.port;
    self.host = options.host;
    self.database = options.database;
    self.ontologies_collection = (options.ontologies_collection)? options.ontologies_collection : "ontologies";
    self.elements_collection = (options.elements_collection)? options.elements_collection : "elements";
};

OntologiesCache.prototype.open = function(callback) {
    const self = this;
    if(!isNull(self.client))
    {
        return callback(null, self.client);
    }
    else
    {
        const url = "mongodb://" + self.host + ":" + self.port + "/" + slug(self.database, '_');
        MongoClient.connect(url, function(err, db) {
            if(isNull(err))
            {
                self.client = db;
                callback(null, db);
            }
            else
            {
                callback(err, db);
            }
        });
    }
};
OntologiesCache.prototype.close = function() {
    const self = this;
    self.client.close();
};

OntologiesCache.prototype._putObjects = function(newObjects, collectionName, callback)
{
    let self = this;

    self.open(function(err, db){

        if(isNull(err))
        {
            const prefixes = Object.keys(newObjects);
            db.collection(collectionName,function(err, collection){
                collection.remove({},function(err, removed){
                    async.mapSeries(prefixes, function(prefix, callback)
                    {
                        let newObj = newObjects[prefix];
                        db.collection(collectionName)
                            .insert(
                                newObj,
                                function (err, result)
                                {
                                    callback(err, newObj);
                                });
                    }, function(err, results){
                        callback(err, results);
                    });
                });
            });
        }
        else
        {
            console.error("Error while connecting to mongodb database " + self.host + " " + self.port + " " + self.collection);
            console.error(JSON.stringify(err));
            callback(err);
        }
    });
};

OntologiesCache.prototype.getOntologies = function(callback)
{
    const self = this;

    self.open(function(err, db)
    {
        if(isNull(err))
        {
            const cursor = db.collection(self.ontologies_collection)
                .find({},{"_id": 0});

            const allObjects = {};

            cursor.toArray(function (err, results)
            {
                for(let i = 0; i < results.length; i++)
                {
                    let result = results[i];
                    allObjects[result.prefix] = result;
                }

                callback(err, allObjects);
            });
        }
        else
        {
            console.error("Error while connecting to mongodb database " + self.host + " " + self.port + " " + self.collection);
            console.error(JSON.stringify(err));
            callback(err);
        }
    });
};

OntologiesCache.prototype.getElements = function(callback)
{
    const self = this;

    self.open(function(err, db)
    {
        if(isNull(err))
        {
            const cursor = db.collection(self.elements_collection)
                .find({},{"_id": 0});

            const allObjects = [];

            const pushToObjectsArray = function(elementsByAPrefix)
            {
                _.each(elementsByAPrefix, function(object, key){
                    allObjects.push(object);
                });
            };

            cursor.toArray(function (err, results)
            {
                for(let i = 0; i < results.length; i++)
                {
                    let elementsByAPrefix = results[i];
                    pushToObjectsArray(elementsByAPrefix);
                }

                callback(err, allObjects);
            });
        }
        else
        {
            console.error("Error while connecting to mongodb database " + self.host + " " + self.port + " " + self.collection);
            console.error(JSON.stringify(err));
            callback(err);
        }
    });
};

OntologiesCache.prototype.putElements = function(newElements, callback)
{
    let self = this;
    self._putObjects(newElements, self.elements_collection, callback);
};

OntologiesCache.prototype.putOntologies = function(newOntologies, callback)
{
    let self = this;
    self._putObjects(newOntologies, self.ontologies_collection, callback);
};

module.exports.OntologiesCache = OntologiesCache;