const async = require("async");
const _ = require("underscore");
const SolrNode = require("solr-node");

const rlequire = require("rlequire");
const slug = rlequire("dendro", "src/utils/slugifier.js");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const fs = require("fs");

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
        self.queried_fields = options.queried_fields;
        return self;
    }

    indexDocument (document, callback)
    {
        const self = this;

        self.client.update(document, function (err, result)
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
            { uri: documentID},
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
                    protocol: "http"
                });

                // Set logger level (can be set to DEBUG, INFO, WARN, ERROR, FATAL or OFF)
                require("log4js").getLogger("solr-node").level = self.connection_log_type;
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

        const queryObject = {};
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

        const fields = Object.keys(self.queried_fields);
        const queryFields = {};

        for (let i = 0; i < fields.length; i++)
        {
            let key = fields[i];
            queryFields[key] = options.query;
        }

        const queryObject = self.client.query()
            .q(queryFields)
            .addParams({
                wt: "json",
                indent: true
            })
            .start(options.skip)
            .rows(options.size);

        self.client.search(queryObject, function (err, result)
        {
            if (isNull(err))
            {
                callback(null, result.rows);
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
        const self = this;
        callback(null, resourceURI);
    }

    getDocumentByResourceURI (resourceURI, callback)
    {
        const self = this;

        const queryObject = self.client.query().q({uri: resourceURI}).rows(1);
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
        uri: db.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    social_dendro: new SolrIndexConnection({
        id: "social_dendro",
        short_name: slug(dbSocial.graphUri),
        uri: dbSocial.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    notifications_dendro: new SolrIndexConnection({
        id: "notifications_dendro",
        short_name: slug(dbNotifications.graphUri),
        uri: dbNotifications.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    dbpedia: new SolrIndexConnection({
        id: "dbpedia",
        short_name: slug("http://dbpedia.org"),
        uri: "http://dbpedia.org",
        queried_fields: ["descriptors.object"]
    }),
    dryad: new SolrIndexConnection({
        id: "dryad",
        short_name: slug("http://dryad.org"),
        uri: "http://dryad.org",
        queried_fields: ["descriptors.object"]
    }),
    freebase: new SolrIndexConnection({
        id: "freebase",
        short_name: slug("http://freebase.org"),
        uri: "http://freebase.org",
        queried_fields: ["descriptors.object"]
    })
};

module.exports.SolrIndexConnection = SolrIndexConnection;
