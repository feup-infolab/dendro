const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;

const util = require('util');
const db = Config.getDBByID();

const es = require('elasticsearch');
const slug = require('slug');

const IndexConnection = function ()
{
};

IndexConnection.indexTypes =
{
    resource: 'resource'
};

// exclude a field from indexing : add "index" : "no".

IndexConnection.indexes = {
    dendro: {
        short_name: slug(db.graphUri),
        uri: db.graphUri,
        elasticsearch_mappings:
    {
        resource: {
            properties: {
                uri:
          {
              type: 'string',
              index: 'not_analyzed' // we only want exact matches, disable term analysis
          },
                graph:
          {
              type: 'string',
              index: 'not_analyzed' // we only want exact matches, disable term analysis
          },
                last_indexing_date:
          {
              type: 'string',
              index: 'not_analyzed' // we only want exact matches, disable term analysis
          },
                descriptors:
          {
              properties:
            {
                predicate:
              {
                  type: 'string',
                  index: 'not_analyzed' // we only want exact matches, disable term analysis
              },
                object:
              {
                  type: 'string',
                  index_options: 'offsets',
                  analyzer: 'standard'
              }
            }
          }
            }
        }
    }
    },
    dbpedia:
  {
      short_name: slug('http://dbpedia.org'),
      uri: 'http://dbpedia.org'
  },
    dryad:
  {
      short_name: slug('http://dryad.org'),
      uri: 'http://dryad.org'
  },
    freebase:
  {
      short_name: slug('http://freebase.org'),
      uri: 'http://freebase.org'
  }
};

IndexConnection.prototype.open = function (host, port, index, callback)
{
    const self = this;
    if (!self.client)
    {
        const util = require('util');

        self.client = {};
        self.host = host;
        self.port = port;
        self.index = index;

        let serverOptions = {
            host: host + ':' + port
        };

        if (Config.debug.index.elasticsearch_connection_log_type !== 'undefined' && Config.elasticsearch_connection_log_type !== '')
        {
            serverOptions.log = Config.debug.index.elasticsearch_connection_log_type;
        }

        if (Config.useElasticSearchAuth)
        {
            serverOptions.secure = Config.useElasticSearchAuth;
            serverOptions.auth = Config.elasticSearchAuthCredentials;
        }

        self.client = new es.Client(serverOptions).cluster.client;

        self.client.indices.getMapping()
            .then(function (mapping)
            {
                return callback(self);
            });
    }
    else
    {
	    return callback(self);
    }
};

IndexConnection.prototype.indexDocument = function (type, document, callback)
{
    const self = this;

    if (typeof document._id !== 'undefined')
    {
        delete document._id;

        self.client.update({
            index: self.index.short_name,
            type: type,
            body: document
        }, function (err, data)
        {
            if (isNull(err))
            {
                return callback(null, 'Document successfully RE indexed' + JSON.stringify(document) + ' with ID ' + data._id);
            }
            console.error(err.stack);
            return callback(1, 'Unable to RE index document ' + JSON.stringify(document));
        });
    }
    else
    {
        self.client.index({
            index: self.index.short_name,
            type: type,
            body: document
        }, function (err, data)
        {
            if (isNull(err))
            {
                return callback(null, 'Document successfully indexed' + JSON.stringify(document) + ' with ID ' + data._id);
            }
            console.error(err.stack);
            return callback(1, 'Unable to index document ' + JSON.stringify(document));
        });
    }
};

IndexConnection.prototype.deleteDocument = function (documentID, type, callback)
{
    const self = this;
    if (isNull(documentID))
    {
        return callback(null, 'No document to delete');
    }

    self.client.delete(self.index.short_name,
        type,
        documentID,
        {},
        function (err, result)
        {
            return callback(err, result);
        })
        .on('data', function (data)
        {
            console.log('Deleting document... data received : ' + data);
        })
        .on('done', function (data)
        {
            return callback(null, 'Document with id ' + documentID + ' successfully deleted.' + '.  result : ' + JSON.stringify(data));
        })
        .on('error', function (data)
        {
            return callback(1, 'Unable to delete document ' + JSON.stringify(document) + '.  error reported : ' + data);
        });
};

IndexConnection.prototype.create_new_index = function (numberOfShards, numberOfReplicas, deleteIfExists, callback)
{
    let self = this;
    let endCallback = callback;
    let async = require('async');
    let indexName = self.index.short_name;

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
                                    return callback();
                                }
                                console.error('Unable do delete index ' + self.index.short_name + ' Error returned  : ' + err);
                                return callback(1);
                            });
                        }
                        else
                        {
                            endCallback(null, true);
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

            settings.body.mappings = self.index.elasticsearch_mappings;
            settings.index = indexName;

            self.client.indices.create(settings, function (err, data)
            {
                if (isNull(err))
                {
                    if (isNull(data.error) && data.acknowledged === true)
                    {
                        endCallback(null, 'Index with name ' + indexName + ' successfully created.');
                    }
                    else
                    {
                        const error = 'Error creating index : ' + JSON.stringify(data);
                        console.error(error);
                        endCallback(err, error);
                    }
                }
                else
                {
                    const error = 'Error creating index : ' + data;
                    console.error(error);
                    endCallback(1, error);
                }
            });
        }
    ]);
};

IndexConnection.prototype.delete_index = function (callback)
{
    const self = this;

    this.client.indices.delete(
        {
            index: self.index.short_name
        }, function (err, data)
        {
            if (isNull(err) && !data.error)
            {
                return callback(null, 'Index with name ' + self.index.short_name + ' successfully deleted.');
            }
            const error = 'Error deleting index : ' + data.error;
            console.error(error);
            return callback(error, data.error);
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
    const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    const xmlHttp = new XMLHttpRequest();

    // var util = require('util');

    // prepare callback
    xmlHttp.onreadystatechange = function ()
    {
        if (xmlHttp.readyState === 4)
        {
            if (xmlHttp.status !== 200)
            {
                throw new Error('[FATAL ERROR] Unable to contact ElasticSearch indexing service on remote server: ' + self.host + ' running on port ' + self.port + '\n Server returned status code ' + xmlHttp.status);
            }
            else
            {
                const response = JSON.parse(xmlHttp.responseText);

                if (response.indices.hasOwnProperty(self.index.short_name))
                {
                    return callback(true);
                }
                return callback(false);
            }
        }

        if (xmlHttp.status &&
            xmlHttp.status !== 200)
        {
            throw new Error('[FATAL ERROR] Unable to contact ElasticSearch indexing service on remote server: ' + self.host + ' running on port ' + self.port + '\n Server returned status code ' + xmlHttp.status);
        }
    };

    const fullUrl = 'http://' + self.host + ':' + self.port + '/_stats';

    xmlHttp.open('GET', fullUrl, true);
    xmlHttp.send(null);
};

// must specify query fields and words as
// var qryObj = {
//	field : term
// }

IndexConnection.prototype.search = function (typeName,
    queryObject,
    callback)
{
    let self = this;

    self.client.search(
        {
            index: self.index.short_name,
            type: typeName,
            body: queryObject
        })
        .then(function (response)
        {
            return callback(null, response.hits.hits);
        }, function (error)
        {
            error = 'Error fetching documents for query : ' + JSON.stringify(queryObject) + '. Reported error : ' + JSON.stringify(error);
            console.error(error);
            return callback(1, error);
        });
};

IndexConnection.prototype.moreLikeThis = function (typeName,
    documentId,
    callback)
{
    let self = this;

    if (!isNull(documentId))
    {
        self.client.search(
            self.index.short_name,
            typeName,
            {
                query: {
                    more_like_this: {
                        docs: [
                            {
                                _index: self.index.short_name,
                                _type: typeName,
                                _id: documentId
                            }
                        ]
                    }
                }
            })
            .then(function (data)
            {
                return callback(null, data.hits.hits);
            }, function (error)
            {
                error = 'Error fetching documents similar to document with ID : ' + documentId + '. Reported error : ' + JSON.stringify(error);
                console.error(error);
                return callback(1, error);
            });
    }
    else
    {
        const error = 'No documentId Specified for similarity calculation';
        console.error(error);
        return callback(1, error);
    }
};

/**
 * Exports
 */

IndexConnection.prototype.transformURIintoVarName = function (uri)
{
    const transformedUri = uri.replace(/[^A-z]|[0-9]/g, '_');
    return transformedUri;
};

module.exports.IndexConnection = IndexConnection;
