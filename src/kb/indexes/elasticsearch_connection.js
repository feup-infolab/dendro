const async = require("async");
const _ = require("underscore");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const slug = rlequire("dendro", "src/utils/slugifier.js");

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const IndexConnection = rlequire("dendro", "src/kb/indexes/index_connection.js").IndexConnection;

const db = Config.getDBByID();
const dbSocial = Config.getDBByID("social");
const dbNotifications = Config.getDBByID("notifications");

const elasticsearch = require("elasticsearch");

class ElasticSearchConnection extends IndexConnection
{
    constructor (options)
    {
        super(options);
        const self = this;
        self.host = options.host;
        self.port = options.port;
        self.elasticsearchMappings = options.elasticsearchMappings;

        self.clientOptions = {
            host: IndexConnection.getAddress(self.host, self.port),
            keepAlive: true
        };

        if (Config.index.elasticsearch.connection_log_type !== "undefined" && Config.index.elasticsearch.connection_log_type !== "")
        {
            self.clientOptions.log = Config.index.elasticsearch.connection_log_type;
        }

        if (self.useElasticSearchAuth)
        {
            self.clientOptions.secure = Config.index.elasticsearch.use_auth;
            self.clientOptions.auth = Config.index.elasticsearch.credentials;
        }

        self._indexIsOpen = false;

        return self;
    }

    ensureIndexIsReady (callback)
    {
        const self = this;

        if (self._indexIsOpen)
        {
            const tryToConnect = function (callback)
            {
                self.client.cluster.health({
                    waitForStatus: "green",
                    index: self.short_name
                }, function (err, result)
                {
                    if (isNull(err))
                    {
                        if (result.status === "green")
                        {
                        // // try a query to see if it gives 503 error (stupid garbage!)
                        // self.client.count({
                        //     index: self.short_name,
                        // }, function (error, response) {
                        //     if(isNull(error))
                        //     {
                        //         callback(null, true);
                        //     }
                        //     else
                        //     {
                        //         callback(error, false)
                        //     }
                        // });

                            callback(null, true);
                        }
                        else
                        {
                            callback(null, false);
                        }
                    }
                    else
                    {
                        callback(err, false);
                    }
                });
            };

            // try calling apiMethod 10 times with linear backoff
            // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
            async.retry({
                times: 240,
                interval: function (retryCount)
                {
                    const msecs = 500;
                    Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to determine ElasticSearch cluster health");
                    return msecs;
                }
            }, tryToConnect, function (err)
            {
                if (isNull(err))
                {
                    callback(null);
                }
                else
                {
                    const msg = "Unable to determine ElasticSearch cluster health in time. This is a fatal error.";
                    Logger.log("error", err.message);
                    throw new Error(msg);
                }
            });
        }
        else
        {
            const tryToConnect = function (callback)
            {
                self.client.indices.open(
                    {
                        index: [self.short_name]
                    },
                    function (err, result)
                    {
                        if (isNull(err))
                        {
                            if (result.acknowledged)
                            {
                                self._indexIsOpen = true;
                                callback(null, true);
                            }
                            else
                            {
                                callback(null, false);
                            }
                        }
                        else
                        {
                            callback(err, false);
                        }
                    }
                );
            };

            // try calling apiMethod 10 times with linear backoff
            // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
            async.retry({
                times: 240,
                interval: function (retryCount)
                {
                    const msecs = 500;
                    Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to ElasticSearch while checking if index " + self.short_name + " is ready...");
                    return msecs;
                }
            }, tryToConnect, function (err)
            {
                if (isNull(err))
                {
                    callback(null);
                }
                else
                {
                    const msg = "Unable to establish a connection to ElasticSearch while checking if index " + self.short_name + " is ready. This is a fatal error.";
                    Logger.log("error", msg);
                    throw new Error(msg);
                }
            });
        }
    }

    ensureElasticSearchIsReady (callback)
    {
        const self = this;

        if (!isNull(self.client))
        {
            callback(null, self.client);
        }
        else
        {
            const tryToConnect = function (callback)
            {
                self.client = new elasticsearch.Client(_.clone(self.clientOptions));

                self.client.ping(
                    function (err, result)
                    {
                        if (isNull(err))
                        {
                            self.client.cluster.putSettings(
                                {
                                    body: {
                                        index: {
                                            number_of_shards: 1,
                                            number_of_replicas: 0
                                        },
                                        persistent: {
                                            "cluster.routing.allocation.disk.threshold_enabled": false,
                                            "cluster.routing.allocation.enable": "all"
                                        }
                                    }
                                }
                                , function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        ElasticSearchConnection._all[self.id] = self;
                                        callback(null, self.client);
                                    }
                                    else
                                    {
                                        callback(err, result);
                                    }
                                });
                        }
                        else
                        {
                            Logger.log("warn", "Error trying to check if ElasticSearch is online.");
                            Logger.log("warn", err);
                            callback(err, false);
                        }
                    });
            };

            // try calling apiMethod 10 times with linear backoff
            // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
            async.retry({
                times: 240,
                interval: function (retryCount)
                {
                    const msecs = 500;
                    Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to ElasticSearch...");
                    return msecs;
                }
            }, tryToConnect, function (err, newClient)
            {
                if (isNull(err))
                {
                    callback(null, newClient);
                }
                else
                {
                    const msg = "Unable to establish a connection to ElasticSearch after several retries. This is a fatal error.";
                    Logger.log("error", msg);
                    throw new Error(msg);
                }
            });
        }
    }

    indexDocument (document, callback)
    {
        const self = this;
        let msg;

        if (!isNull(document._id))
        {
            const documentId = document._id;
            delete document._id;
            self.ensureIndexIsReady(function (err)
            {
                if (isNull(err))
                {
                    self.client.update({
                        index: self.short_name,
                        type: ElasticSearchConnection.indexTypes.resource,
                        id: documentId,
                        body: {
                            doc: document
                        },
                        refresh: "true"
                    }, function (err, result)
                    {
                        if (isNull(err))
                        {
                            callback(null, result);
                        }
                        else
                        {
                            Logger.log("error", err.stack);
                            callback(1, "Unable to REindex document " + JSON.stringify(err, null, 4));
                        }
                    });
                }
                else
                {
                    callback(err, "Unable to connect to elasticsearch for reindexing a document");
                }
            });
        }
        else
        {
            self.ensureIndexIsReady(function (err)
            {
                if (isNull(err))
                {
                    self.client.index({
                        index: self.short_name,
                        type: ElasticSearchConnection.indexTypes.resource,
                        body: document,
                        refresh: "true",
                        timeout: "40s"
                    }, function (err, data)
                    {
                        if (isNull(err))
                        {
                        // if (!isNull(document._id))
                        // {
                        //     msg = "Document successfully REindexed:\n" + JSON.stringify(document) + " with ID " + data._id;
                        // }
                        // else
                        // {
                        //     msg = "Document successfully indexed:\n" + JSON.stringify(document) + " with ID " + data._id;
                        // }
                        //
                        // Logger.log("silly", msg);
                            callback(null, msg);
                        }
                        else
                        {
                            Logger.log("error", err.stack);
                            callback(1, "Unable to index document " + JSON.stringify(document));
                        }
                    });
                }
                else
                {
                    callback(err, "Unable to connect to elasticsearch for indexing a document");
                }
            });
        }
    }

    deleteDocument (resourceUri, callback)
    {
        const self = this;
        if (isNull(resourceUri))
        {
            return callback(null, "No resource URI to delete from " + self.getDescription());
        }

        self.getDocumentIDForResource(resourceUri, function (err, documentID)
        {
            if (isNull(err))
            {
                if (isNull(documentID))
                {
                    callback(null);
                }
                else
                {
                    self.client.delete(
                        {
                            index: self.short_name,
                            type: ElasticSearchConnection.indexTypes.resource,
                            id: documentID,
                            refresh: "true",
                            timeout: "40s"
                        },
                        function (err, result)
                        {
                            if (isNull(err))
                            {
                                callback(null, "Document with id " + documentID + " successfully deleted." + ".  result : " + JSON.stringify(err));
                            }
                            else if (err.status === 404)
                            {
                                callback(null, "Document with id " + documentID + " does not exist already.");
                            }
                            else
                            {
                                callback(err.status, "Unable to delete document " + documentID + ".  error reported : " + JSON.stringify(err));
                            }
                        });
                }
            }
            else
            {
                callback(err, "Unable to connect to elasticsearch for simple search");
            }
        });
    }

    close (cb)
    {
        const self = this;
        if (!isNull(self.client))
        {
            self.client.indices.flush({
                index: [self.short_name]
            }, function (err, result)
            {
                cb(err, result);
            });
        }
        else
        {
            cb(null);
        }
    }

    createNewIndex (callback, deleteIfExists, numberOfShards, numberOfReplicas)
    {
        let self = this;
        let indexName = self.short_name;

        if (isNull(numberOfReplicas))
        {
            numberOfReplicas = 0;
        }

        if (isNull(numberOfShards))
        {
            numberOfShards = 1;
        }

        async.waterfall([
            function (callback)
            {
                self.checkIfIndexExists(
                    function (err, indexAlreadyExists)
                    {
                        if (indexAlreadyExists)
                        {
                            if (deleteIfExists)
                            {
                                self.deleteIndex(function (err)
                                {
                                    if (isNull(err))
                                    {
                                        return callback(null);
                                    }

                                    Logger.log("error", "Unable do delete index " + self.id + " Error returned  : " + err);
                                    return callback(1);
                                });
                            }
                            else
                            {
                                return callback(null);
                            }
                        }
                        else
                        {
                            return callback(null);
                        }
                    });
            },
            function (callback)
            {
                self.checkIfIndexExists(
                    function (err, indexAlreadyExists)
                    {
                        if (isNull(err))
                        {
                            if (indexAlreadyExists)
                            {
                            // nothing to do, index is already created
                                callback(err, null);
                            }
                            else
                            {
                                const settings = {
                                    index: indexName,
                                    body: {
                                        mappings: self.elasticsearchMappings,
                                        settings: {
                                            number_of_shards: numberOfShards,
                                            number_of_replicas: numberOfReplicas,
                                            "index.write.wait_for_active_shards": numberOfShards
                                        }
                                    }
                                };
                                self.ensureElasticSearchIsReady(function (err, client)
                                {
                                    if (isNull(err))
                                    {
                                        self.client.indices.create(settings, function (err, data)
                                        {
                                            if (isNull(err))
                                            {
                                                if (isNull(data.error) && data.acknowledged === true)
                                                {
                                                    Logger.log("Index with name " + indexName + " successfully created.");
                                                    callback(null);
                                                }
                                                else
                                                {
                                                    Logger.log("error", "Error creating index " + self.short_name + ": " + JSON.stringify(data));
                                                    callback(err);
                                                }
                                            }
                                            else
                                            {
                                                if (!isNull(data) && !isNull(data.error) && data.error.type === "resource_already_exists_exception")
                                                {
                                                    Logger.log("Index with name " + indexName + " already exists, no need to create.");
                                                    callback(null);
                                                }
                                                else
                                                {
                                                // TODO This has to retry again!!!!
                                                    Logger.log("error", "Error creating index " + self.short_name + ". Response body was empty. Error was : " + JSON.stringify(err));
                                                    callback(err);
                                                }
                                            }
                                        });
                                    }
                                    else
                                    {
                                        callback(err, client);
                                    }
                                });
                            }
                        }
                        else
                        {
                            Logger.log("error", "Error checking existence of index : " + JSON.stringify(err));
                            callback(err);
                        }
                    }
                );
            }
        ], function (err, results)
        {
            if (isNull(err))
            {
                Logger.log_boot_message("Index " + self.id + " is up and running on elasticsearch at " + self.host + ":" + self.port);
            }
            else
            {
                Logger.log_boot_message("error", "Error creating elasticsearch index " + self.id + " at " + self.host + ":" + self.port);
            }

            callback(err, results);
        });
    }

    deleteIndex (callback)
    {
        const self = this;
        self.checkIfIndexExists(function (err)
        {
            if (isNull(err))
            {
                self.ensureElasticSearchIsReady(function (err, client)
                {
                    if (isNull(err))
                    {
                        self.client.indices.delete(
                            {
                                index: self.short_name
                            }, function (err, data)
                            {
                                if (isNull(err) && !data.error)
                                {
                                    callback(null, "Index with name " + self.short_name + " successfully deleted.");
                                }
                                else
                                {
                                    if (!isNull(data) && !isNull(data.error) && data.error.type === "index_not_found_exception")
                                    {
                                        const error = "Index " + self.short_name + " does not exist, no need to delete.";
                                        Logger.log("info", error);
                                        callback(null, error);
                                    }
                                    else
                                    {
                                        const error = "Error deleting index : " + JSON.stringify(err);
                                        Logger.log("error", error);
                                        callback(err, error);
                                    }
                                }
                            });
                    }
                    else
                    {
                        callback(err, client);
                    }
                });
            }
            else
            {
                callback(err, "Unable to connect to elasticsearch for deleting index " + self.index);
            }
        });
    }

    // according to the elasticsearch docs (see below)
    // http://www.elasticsearch.org/guide/reference/api/admin-indices-indices-exists/

    // ditched the original solution, ended up using this
    // http://192.168.5.69:9200/_status
    // from http://stackoverflow.com/questions/17426521/list-all-indexes-on-elasticsearch-server

    checkIfIndexExists (callback)
    {
        const self = this;

        const tryToConnect = function (callback)
        {
            self.ensureElasticSearchIsReady(function (err)
            {
                if (isNull(err))
                {
                    self.client.indices.exists(
                        {
                            index: self.short_name
                        },
                        function (err, exists)
                        {
                            callback(err, exists);
                        }
                    );
                }
                else
                {
                    callback(err, "Unable to connect to elasticsearch for checking is index exists");
                }
            });
        };

        // try calling apiMethod 10 times with linear backoff
        // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
        async.retry({
            times: 240,
            interval: function (retryCount)
            {
                const msecs = 500;
                Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to verify if ElasticSearch index " + self.short_name + " exists...");
                return msecs;
            }
        }, tryToConnect, function (err, result)
        {
            if (isNull(err))
            {
                callback(err, Boolean(result));
            }
            else
            {
                const msg = "Unable to verify if ElasticSearch index " + self.short_name + " exists, even after several retries. This is a fatal error.";
                Logger.log("error", result);
                throw new Error(msg);
            }
        });
    }

    search (
        options,
        callback)
    {
        let self = this;

        const queryObject = {
            query: {
                match: {
                    "descriptors.object": {
                        query: options.query
                    }
                }
            },
            from: options.from,
            size: options.size,
            sort: [
                "_score"
            ]
        };

        self.ensureIndexIsReady(function (err)
        {
            if (isNull(err))
            {
                self.client.search(
                    {
                        index: self.short_name,
                        type: ElasticSearchConnection.indexTypes.resource,
                        body: queryObject
                    })
                    .then(function (response)
                    {
                        _.map(response.hits.hits, function (hit)
                        {
                            hit.descriptors = hit._source.descriptors;
                            hit.graph = hit._source.graph;
                            hit.last_indexing_date = hit._source.last_indexing_date;
                            hit.uri = hit._source.uri;
                        });

                        callback(null, response.hits.hits);
                    })
                    .catch(function (error)
                    {
                        error = "Error fetching documents for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(error);
                        Logger.log("error", error);
                        callback(1, error);
                    });
            }
            else
            {
                callback(err, "Unable to connect to elasticsearch for simple search");
            }
        });
    }

    moreLikeThis (
        documentId,
        callback)
    {
        let self = this;

        if (!isNull(documentId))
        {
            self.ensureIndexIsReady(function (err)
            {
                if (isNull(err))
                {
                    self.client.search(
                        self.short_name,
                        ElasticSearchConnection.indexTypes.resource,
                        {
                            query: {
                                more_like_this: {
                                    fields: ["descriptors.properties.object"],
                                    like: [
                                        {
                                            _index: self.short_name,
                                            _type: ElasticSearchConnection.indexTypes.resource
                                        }
                                    ],
                                    docs: [
                                        documentId
                                    ],
                                    min_term_freq: 1,
                                    max_query_terms: 12
                                }
                            }
                        })
                        .then(function (data)
                        {
                            return callback(null, data.hits.hits);
                        })
                        .catch(function (error)
                        {
                            error = "Error fetching documents similar to document with ID : " + documentId + ". Reported error : " + JSON.stringify(error);
                            Logger.log("error", error);
                            return callback(1, error);
                        });
                }
                else
                {
                    callback(err, "Unable to connect to elasticsearch for finding textually similar documents.");
                }
            });
        }
        else
        {
            const error = "No documentId Specified for similarity calculation";
            Logger.log("error", error);
            return callback(1, error);
        }
    }

    getDocumentIDForResource (resourceURI, callback)
    {
        const self = this;
        self.getDocumentByResourceURI(resourceURI, function (err, doc)
        {
            if (isNull(err))
            {
                if (isNull(doc))
                {
                    callback(err, doc);
                }
                else
                {
                    callback(err, doc._id);
                }
            }
            else
            {
                callback(err, doc);
            }
        });
    }

    getDocumentByResourceURI (resourceURI, callback)
    {
        const self = this;
        // fetch document from the index that matches the current resource
        const queryObject = {
            query: {
                constant_score: {
                    filter: {
                        term: {
                            uri: resourceURI
                        }
                    }
                }
            },
            from: 0,
            size: 200
        };

        self.client.search(
            {
                index: self.short_name,
                type: ElasticSearchConnection.indexTypes.resource,
                body: queryObject
            },
            function (err, hits)
            {
                if (isNull(err))
                {
                    if (!isNull(hits) && hits instanceof Array && hits.length > 0)
                    {
                        if (hits.length > 1)
                        {
                            Logger.log("error", "Duplicate document in index detected for resource !!! Fix it " + resourceURI);
                        }
                        let hit = hits[0];
                        if (isNull(hit._id))
                        {
                            let message = "_id value is missing when looking for the index document id for " + resourceURI;
                            Logger.log("error", message);
                            return callback(1, message);
                        }

                        return callback(null, hit);
                    }

                    // Resource was not previously indexed
                    return callback(null, null);
                }

                Logger.log("error", "Error getting document ID for resource " + resourceURI + "!");
                Logger.log("error", err.message);
                return callback(1, [hits]);
            }
        );
    }

    getDescription ()
    {
        const self = this;
        return "ElasticSearch Index " + self.id + " running on http://" + self.host + ":" + self.port;
    }
}

ElasticSearchConnection.indexTypes = {
    resource: "resource"
};

ElasticSearchConnection._all = {
    dendro_graph: new ElasticSearchConnection({
        id: "dendro_graph",
        short_name: slug(db.graphUri),
        uri: db.graphUri,
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        elasticsearchMappings:
            {
                resource: {
                    dynamic: false,
                    date_detection: false,
                    numeric_detection: false,
                    properties: {
                        uri:
                            {
                                // we only want exact matches, disable term analysis
                                type: "keyword",
                                index: true
                            },
                        graph:
                            {
                                // we only want exact matches, disable term analysis
                                type: "text",
                                index: true
                            },
                        last_indexing_date:
                            {
                                type: "date"
                            },
                        descriptors:
                            {
                                properties:
                                    {
                                        predicate:
                                            {
                                                type: "keyword",
                                                // we only want exact matches, disable term analysis
                                                index: true
                                            },
                                        object:
                                            {
                                                type: "text",
                                                index: true,
                                                index_options: "offsets",
                                                analyzer: "standard"
                                            }
                                    }
                            }
                    }
                }
            }
    }),
    social_dendro: new ElasticSearchConnection({
        id: "social_dendro",
        short_name: slug(dbSocial.graphUri),
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        uri: dbSocial.graphUri
    }),
    notifications_dendro: new ElasticSearchConnection({
        id: "notifications_dendro",
        short_name: slug(dbNotifications.graphUri),
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        uri: dbNotifications.graphUri
    }),
    dbpedia: new ElasticSearchConnection({
        id: "dbpedia",
        short_name: slug("http://dbpedia.org"),
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        uri: "http://dbpedia.org"
    }),
    dryad: new ElasticSearchConnection({
        id: "dryad",
        short_name: slug("http://dryad.org"),
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        uri: "http://dryad.org"
    }),
    freebase: new ElasticSearchConnection({
        id: "freebase",
        short_name: slug("http://freebase.org"),
        host: Config.index.elasticsearch.host,
        port: Config.index.elasticsearch.port,
        uri: "http://freebase.org"
    })
};

module.exports.ElasticSearchConnection = ElasticSearchConnection;
