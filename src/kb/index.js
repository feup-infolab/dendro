const async = require("async");
const _ = require("underscore");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const db = Config.getDBByID();
const dbSocial = Config.getDBByID("social");
const dbNotifications = Config.getDBByID("notifications");

const es = require("elasticsearch");
const slug = require("slug");

const IndexConnection = function (options)
{
    const self = this;
    self.host = options.host;
    self.port = options.port;
    self.id = options.id;
    self.short_name = options.short_name;
    self.uri = options.uri;
    self.elasticsearchMappings = options.elasticsearchMappings;
    return self;
};

IndexConnection.indexTypes =
{
    resource: "resource"
};

// exclude a field from indexing : add "index" : "no".

IndexConnection._all = {
    dendro_graph: new IndexConnection({
        id: "dendro_graph",
        short_name: slug(db.graphUri),
        uri: db.graphUri,
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        elasticsearchMappings:
                {
                    resource: {
                        dynamic: false,
                        date_detection: false,
                        numeric_detection: false,
                        properties: {
                            uri:
                                {
                                    type: "string",
                                    // we only want exact matches, disable term analysis
                                    index: "not_analyzed"
                                },
                            graph:
                                {
                                    type: "string",
                                    // we only want exact matches, disable term analysis
                                    index: "not_analyzed"
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
                                                    type: "string",
                                                    // we only want exact matches, disable term analysis
                                                    index: "not_analyzed"
                                                },
                                            object:
                                                {
                                                    type: "string",
                                                    index_options: "offsets",
                                                    analyzer: "standard"
                                                }
                                        }
                                }
                        }
                    }
                }
    }),
    social_dendro: new IndexConnection({
        id: "social_dendro",
        short_name: slug(dbSocial.graphUri),
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        uri: dbSocial.graphUri
    }),
    notifications_dendro: new IndexConnection({id: "notifications_dendro",
        short_name: slug(dbNotifications.graphUri),
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        uri: dbNotifications.graphUri
    }),
    dbpedia: new IndexConnection({
        id: "dbpedia",
        short_name: slug("http://dbpedia.org"),
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        uri: "http://dbpedia.org"
    }),
    dryad: new IndexConnection({
        id: "dryad",
        short_name: slug("http://dryad.org"),
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        uri: "http://dryad.org"
    }),
    freebase: new IndexConnection({
        id: "freebase",
        short_name: slug("http://freebase.org"),
        host: Config.elasticSearchHost,
        port: Config.elasticSearchPort,
        uri: "http://freebase.org"
    })
};

IndexConnection.initAllIndexes = function (callback)
{
    async.mapSeries(Object.keys(IndexConnection._all), function (key, cb)
    {
        const index = new IndexConnection(IndexConnection._all[key]);
        index.open(function (err, result)
        {
            IndexConnection._all[key] = result;
            if (isNull(err))
            {
                const newIndex = IndexConnection.get(key);

                if (!isNull(newIndex))
                {
                    cb(null, newIndex);
                }
                else
                {
                    cb(1, "Unable to get index connection to index " + key + " right after creating it!");
                }
            }
            else
            {
                cb(3, "Unable to open index connection to index " + key + ".");
            }
        });
    }, function (err, results)
    {
        callback(err, results);
    });
};

IndexConnection.get = function (indexKey)
{
    const index = IndexConnection._all[indexKey];
    if (!isNull(index))
    {
        return index;
    }

    Logger.log("warn", "Index parametrization does not exist for key " + indexKey);
    return null;
};

IndexConnection.getByGraphUri = function (graphUri)
{
    if (isNull(IndexConnection._indexesByUri))
    {
        IndexConnection._indexesByUri = {};
    }

    if (!isNull(IndexConnection._indexesByUri[graphUri]))
    {
        return IndexConnection._indexesByUri[graphUri];
    }

    if (!isNull(graphUri))
    {
        const connectionKey = _.find(Object.keys(IndexConnection._all), function (key)
        {
            const searchConnection = IndexConnection._all[key];
            return searchConnection.uri === graphUri;
        });
        if (isNull(connectionKey))
        {
            Logger.log("warn", "Invalid index connection URI " + graphUri + " !");
        }
        else
        {
            const connection = IndexConnection._all[connectionKey];
            IndexConnection._indexesByUri[graphUri] = connection;
            return connection;
        }
    }
    else
    {
        return IndexConnection.getDefault();
    }
};

IndexConnection.getDefault = function ()
{
    return IndexConnection.get("dendro_graph");
};

IndexConnection.prototype.open = function (callback)
{
    const self = this;
    const tryToConnect = function (callback)
    {
        let serverOptions = {
            host: self.host + ":" + self.port
        };

        if (Config.debug.index.elasticsearch_connection_log_type !== "undefined" && Config.elasticsearch_connection_log_type !== "")
        {
            serverOptions.log = Config.debug.index.elasticsearch_connection_log_type;
        }

        if (Config.useElasticSearchAuth)
        {
            serverOptions.secure = Config.useElasticSearchAuth;
            serverOptions.auth = Config.elasticSearchAuthCredentials;
        }

        self.client = new es.Client(JSON.parse(JSON.stringify(serverOptions))).cluster.client;

        self.client.ping({
            // undocumented params are appended to the query string
            hello: "elasticsearch!"
        }, function (error)
        {
            if (error)
            {
                callback(error, "elasticsearch cluster is down!");
            }
            else
            {
                self.client.indices.getMapping()
                    .then(function (mapping)
                    {
                        // Logger.log("silly", "Elasticsearch connection ok!");
                        return callback(null, self);
                    },
                    function (error)
                    {
                        Logger.log("error", "Error getting elasticSearch mappings");
                        Logger.log("error", error);
                        return callback(error, self);
                    }
                    );
            }
        });
    };

    // try calling apiMethod 10 times with linear backoff
    // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
    async.retry({
        times: 10,
        interval: function (retryCount)
        {
            const msecs = 50 * Math.pow(2, retryCount);
            Logger.log("Waiting " + msecs / 1000 + " seconds to retry a connection to ElasticSearch...");
            return msecs;
        }
    }, tryToConnect, function (err, result)
    {
        if (!isNull(err))
        {
            Logger.log("error", "Unable to establish a connection to ElasticSearch after several retries. This is a fatal error.");
        }
        callback(err, result);
    });
};

IndexConnection.prototype.deleteDocumentsWithUri = function (uri, callback)
{
    const self = this;
    // fetch document from the index that matches the current resource
    const queryObject = {
        query: {
            constant_score: {
                filter: {
                    term: {
                        uri: self.uri
                    }
                }
            }
        },
        from: 0,
        size: 10000
    };

    // search in all graphs for resources (generic type)
    const indexType = IndexConnection.indexTypes.resource;

    self.search(
        indexType,
        queryObject,
        function (err, hits)
        {
            if (isNull(err))
            {
                async.map(hits, function (hit, cb)
                {
                    self.deleteDocument(hit._id, indexType, cb);
                }, callback);
            }
            else
            {
                return callback(err, [hits]);
            }
        }
    );
};

IndexConnection.prototype.indexDocument = function (type, document, callback)
{
    const self = this;
    let msg;

    if (!isNull(document._id))
    {
        const documentId = document._id;
        delete document._id;
        self.open(function (err)
        {
            if (!err)
            {
                self.client.update({
                    index: self.short_name,
                    type: type,
                    id: documentId,
                    body: {
                        doc: document
                    },
                    waitForActiveShards: "all",
                    refresh: "true"
                }, function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null, result);
                    }

                    Logger.log("error", err.stack);
                    return callback(1, "Unable to REindex document " + JSON.stringify(err, null, 4));
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
        self.open(function (err)
        {
            if (!err)
            {
                self.client.index({
                    index: self.short_name,
                    type: type,
                    body: document,
                    waitForActiveShards: "all",
                    refresh: "true"
                }, function (err, data)
                {
                    if (isNull(err))
                    {
                        if (!isNull(document._id))
                        {
                            msg = "Document successfully REindexed:\n" + JSON.stringify(document) + " with ID " + data._id;
                        }
                        else
                        {
                            msg = "Document successfully indexed:\n" + JSON.stringify(document) + " with ID " + data._id;
                        }

                        Logger.log("silly", msg);
                        return callback(null, msg);
                    }

                    Logger.log("error", err.stack);
                    return callback(1, "Unable to index document " + JSON.stringify(document));
                });
            }
            else
            {
                callback(err, "Unable to connect to elasticsearch for indexing a document");
            }
        });
    }
};

IndexConnection.prototype.deleteDocument = function (documentID, type, callback)
{
    const self = this;
    if (isNull(documentID))
    {
        return callback(null, "No document to delete");
    }

    self.open(function (err)
    {
        if (!err)
        {
            self.client.delete(
                {
                    index: self.short_name,
                    type: type,
                    id: documentID,
                    refresh: "true",
                    waitForActiveShards: "true"
                },
                function (err, result)
                {
                    if (isNull(err))
                    {
                        return callback(null, "Document with id " + documentID + " successfully deleted." + ".  result : " + JSON.stringify(err));
                    }
                    else if (err.status === 404)
                    {
                        return callback(null, "Document with id " + documentID + " does not exist already.");
                    }

                    return callback(err.status, "Unable to delete document " + documentID + ".  error reported : " + JSON.stringify(err));
                });
        }
        else
        {
            callback(err, "Unable to connect to elasticsearch for simple search");
        }
    });
};

IndexConnection.create_all_indexes = function (numberOfShards, numberOfReplicas, deleteIfExists, callback)
{
    async.mapSeries(Object.keys(IndexConnection._all), function (key, cb)
    {
        IndexConnection._all[key].create_new_index(numberOfShards, numberOfReplicas, deleteIfExists, cb);
    }, function (err, results)
    {
        callback(err, results);
    });
};

IndexConnection.prototype.create_new_index = function (numberOfShards, numberOfReplicas, deleteIfExists, callback)
{
    let self = this;
    let indexName = self.short_name;

    async.waterfall([
        function (callback)
        {
            self.check_if_index_exists(
                function (indexAlreadyExists)
                {
                    if (indexAlreadyExists)
                    {
                        if (deleteIfExists)
                        {
                            self.delete_index(function (err)
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
            self.check_if_index_exists(
                function (indexAlreadyExists)
                {
                    if (indexAlreadyExists)
                    {
                        // nothing to do, index is already created
                        callback(null);
                    }
                    else
                    {
                        const settings = {
                            body: {}
                        };

                        if (numberOfShards)
                        {
                            settings.number_of_shards = numberOfShards;
                        }

                        if (numberOfReplicas)
                        {
                            settings.number_of_replicas = numberOfReplicas;
                        }

                        settings.body.mappings = self.elasticsearchMappings;
                        settings.index = indexName;

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
                                    Logger.log("error", "Error creating index : " + JSON.stringify(data));
                                    callback(err);
                                }
                            }
                            else
                            {
                                if (!isNull(data.error) && data.error.type === "index_already_exists_exception")
                                {
                                    Logger.log("Index with name " + indexName + " already exists, no need to create.");
                                    callback(null);
                                }
                                else
                                {
                                    Logger.log("error", "Error creating index : " + JSON.stringify(data));
                                    callback(1);
                                }
                            }
                        });
                    }
                }
            );
        }
    ], function (err, results)
    {
        callback(err, results);
    });
};

IndexConnection.prototype.delete_index = function (callback)
{
    const self = this;
    self.open(function (err)
    {
        if (!err)
        {
            self.client.indices.delete(
                {
                    index: self.short_name
                }, function (err, data)
                {
                    if (isNull(err) && !data.error)
                    {
                        return callback(null, "Index with name " + self.short_name + " successfully deleted.");
                    }

                    const error = "Error deleting index : " + JSON.stringify(data);
                    Logger.log("error", error);
                    self.client.close();
                    return callback(error, data.error);
                });
        }
        else
        {
            callback(err, "Unable to connect to elasticsearch for deleting index " + self.index);
        }
    });
};

// according to the elasticsearch docs (see below)
// http://www.elasticsearch.org/guide/reference/api/admin-indices-indices-exists/

// ditched the original solution, ended up using this
// http://192.168.5.69:9200/_status
// from http://stackoverflow.com/questions/17426521/list-all-indexes-on-elasticsearch-server

IndexConnection.prototype.check_if_index_exists = function (callback)
{
    const self = this;
    const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    const xmlHttp = new XMLHttpRequest();

    // var util = require('util');

    // prepare callback
    xmlHttp.onreadystatechange = function ()
    {
        if (xmlHttp.readyState === 4)
        {
            if (xmlHttp.status !== 200)
            {
                throw new Error("[FATAL ERROR] Unable to contact ElasticSearch indexing service on remote server: " + self.host + " running on port " + self.port + "\n Server returned status code " + xmlHttp.status);
            }
            else
            {
                const response = JSON.parse(xmlHttp.responseText);

                if (response.indices.hasOwnProperty(self.short_name))
                {
                    return callback(true);
                }

                return callback(false);
            }
        }

        if (xmlHttp.status &&
            xmlHttp.status !== 200)
        {
            throw new Error("[FATAL ERROR] Unable to contact ElasticSearch indexing service on remote server: " + self.host + " running on port " + self.port + "\n Server returned status code " + xmlHttp.status);
        }
    };

    const fullUrl = "http://" + self.host + ":" + self.port + "/_stats";

    xmlHttp.open("GET", fullUrl, true);
    xmlHttp.send(null);
};

// must specify query fields and words as
// var qryObj = {
//	field : term
// }

IndexConnection.prototype.search = function (
    typeName,
    queryObject,
    callback)
{
    let self = this;

    self.open(function (err)
    {
        if (!err)
        {
            self.client.search(
                {
                    index: self.short_name,
                    type: typeName,
                    body: queryObject
                })
                .then(function (response)
                {
                    self.client.close();
                    return callback(null, response.hits.hits);
                }, function (error)
                {
                    error = "Error fetching documents for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(error);
                    Logger.log("error", error);
                    self.client.close();
                    return callback(1, error);
                });
        }
        else
        {
            callback(err, "Unable to connect to elasticsearch for simple search");
        }
    });
};

IndexConnection.prototype.moreLikeThis = function (
    typeName,
    documentId,
    callback)
{
    let self = this;

    if (!isNull(documentId))
    {
        self.open(function (err)
        {
            if (!err)
            {
                self.client.search(
                    self.short_name,
                    typeName,
                    {
                        query: {
                            more_like_this: {
                                docs: [
                                    {
                                        _index: self.short_name,
                                        _type: typeName,
                                        _id: documentId
                                    }
                                ]
                            }
                        }
                    })
                    .then(function (data)
                    {
                        self.client.close();
                        return callback(null, data.hits.hits);
                    }, function (error)
                    {
                        self.client.close();
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
};

module.exports.IndexConnection = IndexConnection;
