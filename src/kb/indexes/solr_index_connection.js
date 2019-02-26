const async = require("async");
const _ = require("underscore");
const SolrNode = require("solr-node");

const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const IndexConnection = rlequire("dendro", "src/kb/indexes/index_connection.js").IndexConnection;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const db = Config.getDBByID();
const dbSocial = Config.getDBByID("social");
const dbNotifications = Config.getDBByID("notifications");

class SolrIndexConnection extends IndexConnection
{
    constructor (options)
    {
        super(options);
        const self = this;

        _.extend(options, Config.index.solr);

        self.host = options.host;
        self.port = options.port;
        self.connection_log_type = options.connection_log_type;

        self._indexIsOpen = false;

        return self;
    }

    indexDocument (document, callback)
    {
        const self = this;

        const emptyDoc = {
            id: document.uri,
            uri : document.uri,
            last_indexing_date: (new Date()).toISOString(),
            graph: self.uri
        };

        for(let i = 0; i < document.descriptors.length; i++)
        {
            let predicate = document.descriptors[i].predicate;
            let object = document.descriptors[i].object;
            if(isNull(emptyDoc[predicate]))
            {
                emptyDoc[predicate] = [object];
            }
            else
            {
                emptyDoc[predicate].push(object);
            }
        }

        self.client.update(emptyDoc, function (err, result)
        {
            if (isNull(err))
            {
                callback(err, result);
            }
            else
            {
                Logger.log("error", err.stack);
                callback(1, "Unable to Insert New document during indexing in SOLR" + JSON.stringify(err, null, 4));
                callback(err);
            }
        });
    }

    deleteDocument (documentID, callback)
    {
        const self = this;
        if (isNull(documentID))
        {
            return callback(null, "No document to delete");
        }

        self.client.delete(
            { id: documentID},
            function (err, result)
            {
                if (isNull(err))
                {
                    callback(null, "Document with id " + documentID + " successfully deleted from SOLR." + ".  result : " + JSON.stringify(err));
                }
                else if (err.status === 404)
                {
                    callback(null, "Document with id " + documentID + " does not exist already in SOLR.");
                }
                else
                {
                    callback(err.status, "Unable to delete document " + documentID + ".  error reported : " + JSON.stringify(err));
                }
            });
    }

    close (callback)
    {
        callback(null);
    }

    createNewIndex (callback, deleteIfExists)
    {
        const self = this;
        async.series([
            function (callback)
            {
                self.checkIfIndexExists(function (err, indexAlreadyExists)
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
                // Create client
                self.client = new SolrNode({
                    host: self.host,
                    port: self.port,
                    core: self.id,
                    protocol: "http",

                });
                callback(null, self.client);
            }
        ], function (err, results)
        {
            callback(err, results);
        });
    }

    deleteIndex (callback)
    {
        const self = this;

        if (isNull(self.client))
        {
            // Create client
            self.client = new SolrNode({
                host: self.host,
                port: self.port,
                core: self.id,
                protocol: "http"
            });
        }

        const queryObject = "*:*";
        self.client.delete(queryObject, function (err, result)
        {
            if (isNull(err))
            {
                callback(null, result);
            }
            else
            {
                const error = "Error deleting SOLR core (index)  " + self.id + ". Reported error : " + JSON.stringify(err);
                Logger.log("error", error);
                callback(1, error);
            }
        });
    }

    checkIfIndexExists (callback)
    {
        callback(null, true);
    }

    search (
        options,
        callback)
    {
        let self = this;

        const queryObject = self.client.query()
            .q("*:*")
            .q(options.query)
            .addParams({
                wt: "json",
                indent: true
            });

        if (options.skip)
        {
            queryObject.start(options.skip);
        }

        if (options.size)
        {
            queryObject.rows(options.size);
        }

        self.client.search(queryObject, function (err, result)
        {
            if (isNull(err))
            {
                callback(null, result.response.docs);
            }
            else
            {
                const error = "Error fetching documents from solr for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(err);
                Logger.log("error", error);
                callback(1, error);
            }
        });
    }

    getDocumentIDForResource (resourceURI, callback)
    {
        callback(null, resourceURI);
    }

    getDocumentByResourceURI (resourceURI, callback)
    {
        const self = this;

        const queryObject = self.client.query().q({id: resourceURI}).rows(1);
        self.client.search(queryObject, function (err, result)
        {
            if (isNull(err))
            {
                callback(null, result.rows);
            }
            else
            {
                const error = "Error fetching document by id " + resourceURI + "from solr for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(err);
                Logger.log("error", error);
                callback(1, error);
            }
        });
    }

    static closeConnections (cb)
    {
        cb(null);
    }
}

SolrIndexConnection._all = {
    dendro_graph: new SolrIndexConnection({
        id: "dendro_graph",
        short_name: slug(db.graphUri),
        uri: db.graphUri
    }),
    social_dendro: new SolrIndexConnection({
        id: "social_dendro",
        short_name: slug(dbSocial.graphUri),
        uri: dbSocial.graphUri
    }),
    notifications_dendro: new SolrIndexConnection({
        id: "notifications_dendro",
        short_name: slug(dbNotifications.graphUri),
        uri: dbNotifications.graphUri
    }),
    dbpedia: new SolrIndexConnection({
        id: "dbpedia",
        short_name: slug("http://dbpedia.org"),
        uri: "http://dbpedia.org"
    }),
    dryad: new SolrIndexConnection({
        id: "dryad",
        short_name: slug("http://dryad.org"),
        uri: "http://dryad.org"
    }),
    freebase: new SolrIndexConnection({
        id: "freebase",
        short_name: slug("http://freebase.org"),
        uri: "http://freebase.org"
    })
};

module.exports.SolrIndexConnection = SolrIndexConnection;
