const async = require("async");
const _ = require("underscore");
const path = require("path");

const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-quick-search"));
PouchDB.plugin(require("pouchdb-upsert"));

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

class SearchIndexConnection extends IndexConnection
{
    constructor (options)
    {
        super(options);
        const self = this;
        self.queried_fields = options.queried_fields;
        if (!isNull(Config.index.si))
        {
            self.indexLocation = path.join(rlequire.absPathInApp("dendro", Config.index.si.index_file_locations), self.id);
        }
        return self;
    }

    indexDocument (document, callback)
    {
        const self = this;

        self.getDocumentByResourceURI(document.uri, function (err, retrievedDoc)
        {
            if (isNull(err))
            {
                if (isNull(retrievedDoc))
                {
                    const newDocument = {};
                    newDocument._id = document.uri;

                    _.extend(newDocument, document);

                    Logger.log("debug", "Indexing document " + JSON.stringify(newDocument) + " in PouchDB Search Index " + self.id);

                    self.client.put(newDocument)
                        .then(function (result)
                        {
                            // force building of the index
                            self.client.search({
                                fields: self.queried_fields,
                                build: true
                            }).then(function (result)
                            {
                                callback(null, result);
                            }).catch(function (err)
                            {
                                callback(1, err);
                            });

                            // self.client.get(
                            //     result.id,
                            //     function(err, retrievedAfterInsert){
                            //         callback(err, result);
                            //     });
                        })
                        .catch(function (err)
                        {
                            Logger.log("error", err.stack);
                            callback(1, "Unable to Insert New document during indexing " + JSON.stringify(err, null, 4));
                        });
                }
                else
                {
                    self.client.get(retrievedDoc._id).then(function (originalDoc)
                    {
                        const updatedDoc = {};
                        _.extend(updatedDoc, originalDoc, document);
                        return self.client.put(updatedDoc);
                    }).then(function (response)
                    {
                        callback(null, response);
                    }).catch(function (err)
                    {
                        Logger.log("error", err.stack);
                        callback(1, "Unable to insert document during indexing  " + JSON.stringify(err, null, 4));
                        callback(err);
                    });
                }
            }
            else
            {
                callback(err, retrievedDoc);
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

        self.client.remove(
            documentID,
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
                const mkdirp = require("mkdirp");
                mkdirp(self.indexLocation, callback);
            },
            function (callback)
            {
                self.client = new PouchDB(self.indexLocation);
                self.client.search({
                    fields: self.queried_fields,
                    // force building of the index when starting up
                    build: true
                }).then(function (info)
                {
                    callback(null, info);
                    // if build was successful, info is {"ok": true}
                }).catch(function (err)
                {
                    Logger.log("error", "Error occurred when starting up and rebuilding index " + self.id + ".  error reported : " + JSON.stringify(err));
                    callback(err);
                });
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
            self.client = new PouchDB(self.indexLocation);
        }

        self.client.destroy().then(function (response)
        {
            callback(null, response);
        }).catch(function (err)
        {
            Logger.log("error", "Error occurred when deleting index " + self.id + ".  error reported : " + JSON.stringify(err));
            callback(err);
        });
    }

    checkIfIndexExists (callback)
    {
        // function will check if a directory exists, and create it if it doesn't
        // from https://blog.raananweber.com/2015/12/15/check-if-a-directory-exists-in-node-js/
        function checkDirectory (directory, callback)
        {
            fs.stat(directory, function (err, stats)
            {
                // Check if error defined and the error code is "not exists"
                if (err && err.errno === 34)
                {
                    callback(null, false);
                }
                else if (!err)
                {
                    callback(null, true);
                }
                else
                {
                    // just in case there was a different error:
                    callback(err, false);
                }
            });
        }

        const self = this;
        checkDirectory(self.indexLocation, function (err, dirExists)
        {
            callback(err, dirExists);
        });
    }

    search (
        options,
        callback)
    {
        let self = this;

        const queryObject = {
            query: options.query,
            fields: self.queried_fields,
            skip: options.from,
            limit: options.size
        };

        self.client.search(
            {
                fields: self.queried_fields,
                query: queryObject,
                include_docs: true
            })
            .then(function (response)
            {
                callback(null, response.rows);
            })
            .catch(function (error)
            {
                error = "Error fetching documents for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(error);
                Logger.log("error", error);
                callback(1, error);
            });
    }

    getDocumentIDForResource (resourceURI, callback)
    {
        const self = this;
        self.client.get(resourceURI)
            .then(function (doc)
            {
                callback(null, resourceURI);
            })
            .catch(function (err)
            {
                if (err.status === 404)
                {
                    callback(null, null);
                }
                else
                {
                    callback(err);
                }
            });
    }

    getDocumentByResourceURI (resourceURI, callback)
    {
        const self = this;

        self.client.get(resourceURI)
            .then(function (doc)
            {
                callback(null, doc);
            })
            .catch(function (err)
            {
                if (err.status === 404)
                {
                    callback(null, null);
                }
                else
                {
                    callback(err);
                }
            });
    }

    static closeConnections (cb)
    {
        cb(null);
    }
}

SearchIndexConnection._all = {
    dendro_graph: new SearchIndexConnection({
        id: "dendro_graph",
        short_name: slug(db.graphUri),
        uri: db.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    social_dendro: new SearchIndexConnection({
        id: "social_dendro",
        short_name: slug(dbSocial.graphUri),
        uri: dbSocial.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    notifications_dendro: new SearchIndexConnection({
        id: "notifications_dendro",
        short_name: slug(dbNotifications.graphUri),
        uri: dbNotifications.graphUri,
        queried_fields: ["descriptors.object"]
    }),
    dbpedia: new SearchIndexConnection({
        id: "dbpedia",
        short_name: slug("http://dbpedia.org"),
        uri: "http://dbpedia.org",
        queried_fields: ["descriptors.object"]
    }),
    dryad: new SearchIndexConnection({
        id: "dryad",
        short_name: slug("http://dryad.org"),
        uri: "http://dryad.org",
        queried_fields: ["descriptors.object"]
    }),
    freebase: new SearchIndexConnection({
        id: "freebase",
        short_name: slug("http://freebase.org"),
        uri: "http://freebase.org",
        queried_fields: ["descriptors.object"]
    })
};

module.exports.SearchIndexConnection = SearchIndexConnection;
