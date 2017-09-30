const util = require("util");
const async = require("async");
const path = require("path");
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
    self.collection = "all_ontologies"
};

OntologiesCache.prototype.open = function(callback) {
    const self = this;
    if(!isNull(self.client))
    {
        return callback(1, "Ontologies cache connection is already open.");
    }
    else
    {
        const url = "mongodb://" + self.host + ":" + self.port + "/" + slug(self.database, '_');
        MongoClient.connect(url, function(err, db) {
            if(isNull(err))
            {
                self.client = db;
                callback(null, self);
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

OntologiesCache.prototype.get = function(callback)
{
    let self = this;

    self.open(function(err, result)
    {
        const cursor = self.client.collection(self.collection)
            .find({},{"_id": 0});

        const allOntologies = {};

        cursor.toArray(function (err, ontologies)
        {
            for(let i = 0; i < ontologies.length; i++)
            {
                let ontology = ontologies[i];
                allOntologies[ontology.prefix] = ontology;
            }

            callback(err, allOntologies);
        });
    });
};

OntologiesCache.prototype.put = function(newOntologies, callback)
{
    let self = this;

    self.open(function(err, result){
        const prefixes = Object.keys(newOntologies);
        self.client.collection(self.collection,function(err, collection){
            collection.remove({},function(err, removed){
                async.map(prefixes, function(prefix, callback)
                {
                    let ontologyObj = newOntologies[prefix];
                    self.client.collection(self.collection)
                        .insert(
                            ontologyObj,
                            function (err, result)
                            {
                                callback(err, result);
                            });
                }, callback);
            });
        });
    });
};

module.exports.OntologiesCache = OntologiesCache;