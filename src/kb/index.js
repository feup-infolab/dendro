var Config = function() { return GLOBAL.Config; }();

var util = require('util');
var db = function() { return GLOBAL.db.default; }();
var es = require('elasticsearch');
var slug = require('slug');

IndexConnection.indexTypes =
{
    resource : "resource"
};

//exclude a field from indexing : add "index" : "no".

IndexConnection.indexes = {
    dendro : {
        short_name : slug(db.graphUri),
        uri : db.graphUri,
        elasticsearch_mappings :
        {
           "resource" : {
                "properties" : {
                    "uri" :
                    {
                        "type" : "string",
                        "index" : "not_analyzed" //we only want exact matches, disable term analysis
                    },
                    "graph" :
                    {
                        "type" : "string",
                        "index" : "not_analyzed" //we only want exact matches, disable term analysis
                    },
                    "last_indexing_date" :
                    {
                        "type" : "string",
                        "index" : "not_analyzed" //we only want exact matches, disable term analysis
                    },
                    "descriptors" :
                    {
                        "properties" :
                        {
                            "predicate" :
                            {
                                "type" : "string",
                                "index" : "not_analyzed" //we only want exact matches, disable term analysis
                            },
                            "object" :
                            {
                                "type" : "string",
                                "index_options" : "offsets",
                                "analyzer" : "standard"
                            }
                        }
                    }
                }
            }
        }
    },
    dbpedia :
    {
        short_name : slug("http://dbpedia.org"),
        uri : "http://dbpedia.org"
    },
    dryad :
    {
        short_name : slug("http://dryad.org"),
        uri : "http://dryad.org"
    },
    freebase :
    {
        short_name : slug("http://freebase.org"),
        uri : "http://freebase.org"
    }
};

function IndexConnection()
{
    let self = this;
}

IndexConnection.prototype.open = function(host, port, index, callback)
{	
    var self = this;
    if (!self.client)
    {
		const util = require('util');
		
		self.client = {};
		self.host = host;
		self.port = port;
        self.index = index;

        let serverOptions = {
            host: host + ":" + port,
        };

        if(Config.debug.index.elasticsearch_connection_log_type !== null && Config.elasticsearch_connection_log_type !== "")
        {
            serverOptions.log = Config.debug.index.elasticsearch_connection_log_type;
        }
        
        if(Config.useElasticSearchAuth)
        {
            serverOptions.secure = Config.useElasticSearchAuth;
            serverOptions.auth = Config.elasticSearchAuthCredentials;
        }
        
		self.client = new es.Client(serverOptions).cluster.client;

        self.client.indices.getMapping()
            .then(function(mapping){
                console.log(mapping);
                callback(self);
            });
    }
    else
    {
	    callback(self);
    }
};



IndexConnection.prototype.indexDocument = function(type, document, callback) {
    var self = this;

    if(document._id != null)
    {
        delete document._id;

        self.client.update({
            index : self.index.short_name,
            type : type,
            body : document
        }, function(err, data)
        {
            if(!err)
            {
                callback(0, "Document successfully RE indexed" + JSON.stringify(document) + " with ID " + data._id);
            }
            else
            {
                console.error(err.stack);
                callback(1, "Unable to RE index document " + JSON.stringify(document));
            }
        });
    }
    else
    {
        /*self.client.indices.getMapping()
            .then(function(mapping){
                console.log(mapping);
            });*/

        self.client.index({
            index : self.index.short_name,
            type : type,
            body : document
        }, function(err, data)
        {
            if(!err)
            {
                callback(0, "Document successfully indexed" + JSON.stringify(document) + " with ID " + data._id);
            }
            else
            {
                console.error(err.stack);
                callback(1, "Unable to index document " + JSON.stringify(document));
            }
        });
    }
};

IndexConnection.prototype.deleteDocument = function(documentID, type, callback)
{
    var self = this;
    if(documentID == null)
    {
        callback(null, "No document to delete");
    }

    self.client.delete(self.index.short_name,
        type,
        documentID,
        {},
        function(err, result) {
            callback(err, result);
        })
        .on('data', function(data) {
            console.log("Deleting document... data received : " + data);
        })
        .on('done', function(data) {
            callback(0, "Document with id " + documentID + " successfully deleted." + ".  result : " + JSON.stringify(data));
        })
        .on('error', function(data) {
            callback(1, "Unable to delete document " + JSON.stringify(document) + ".  error reported : " + data);
        })
};

IndexConnection.prototype.create_new_index = function(numberOfShards, numberOfReplicas, deleteIfExists, callback)
{
    let self = this;
    let endCallback = callback;
    let async = require('async');
    let indexName = self.index.short_name;
    
    async.waterfall([
        function(callback) {
			self.check_if_index_exists(
                function(err, indexAlreadyExists)
				{
				    if(!err)
				    {
                        if(indexAlreadyExists)
                        {
                            if(deleteIfExists)
                            {
                                self.delete_index(function(err)
                                {
                                    if(!err)
                                    {
                                        callback();
                                    }
                                    else
                                    {
                                        console.error("Unable do delete index " + self.index.short_name + " Error returned  : " + err);
                                        callback(1);
                                    }
                                });
                            }
                            else
                            {
                                endCallback(null, true);
                            }
                        }
                        else
                        {
                            callback(null);
                        }
                    }
                    else
                    {
                        console.error("Unable to check if index " + self.index.short_name + " exists" + " Error returned  : " + err);
                        callback(1);
                    }

				});
		},
		function(callback) {

			var settings = {
			    body : {

                }
            };

			if (numberOfShards) {
                settings.number_of_shards = numberOfShards;
			}

			if (numberOfReplicas) {
                settings.number_of_replicas = numberOfReplicas;
			}

            settings.body.mappings = self.index.elasticsearch_mappings;
			settings.index = indexName;

            self.client.indices.create(settings, function(err, data){
                if(!err)
                {
                    if(data.error == null && data.acknowledged == true)
                    {
                        endCallback(null, "Index with name " + indexName + " successfully created.");
                    }
                    else
                    {
                        const error = "Error creating index : " + JSON.stringify(data);
                        console.error(error);
                        endCallback(err, error);
                    }
                }
                else
                {
                    var error = "Error creating index : " + data;
                    console.error(error);
                    endCallback(1, error);
                }
            });
		}
	]);
};

IndexConnection.prototype.delete_index  = function (callback)
{
    var self = this;

    self.check_if_index_exists(function(err, indexExists){
        if(!err)
        {
            if(indexExists)
            {
                self.client.indices.delete(
                    {
                        index: self.index.short_name
                    }, function(err, data)
                    {
                        if(!err && !data.error)
                        {
                            callback(null, "Index with name " + self.index.short_name + " successfully deleted.");
                        }
                        else
                        {
                            var error = "Error deleting index : " + data.error;
                            console.error(error);
                            callback(error, result);
                        }
                    });
            }
            else
            {
                callback(null, "Index " + self.index.short_name + " does not exist, no need to delete it.");
            }
        }
        else
        {
            callback(err, indexExists);
        }
    });
};

// according to the elasticsearch docs (see below)
// http://www.elasticsearch.org/guide/reference/api/admin-indices-indices-exists/

//ditched the original solution, ended up using this
//http://192.168.5.69:9200/_status
//from http://stackoverflow.com/questions/17426521/list-all-indexes-on-elasticsearch-server

IndexConnection.prototype.check_if_index_exists = function (callback)
{
    var self = this;
	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	var xmlHttp = new XMLHttpRequest();

    //var util = require('util');

	// prepare callback
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4) {

            if (xmlHttp.status != 200)  {
                const msg = "[FATAL ERROR] Unable to contact ElasticSearch indexing service " +
                "on remote server: "+ self.host + " running on port " + self.port + "\n Server returned status code " + xmlHttp.status;
                console.log(msg);

                callback(1, msg);
            }
            else
            {
                var response = JSON.parse(xmlHttp.responseText);

                if(response.indices[self.index.short_name] != null)
                {
                    callback(null, true);
                }
                else
                {
                    callback(null, false);
                }
            }
		}

        if (xmlHttp.status &&
            xmlHttp.status != 200)  {
		    const msg = "[FATAL ERROR] Unable to contact ElasticSearch indexing service " +
                "on remote server: "+ self.host + " running on port " + self.port + "\n Server returned status code " + xmlHttp.status;
            console.error(msg);
            callback(1, msg);
        }
	};

	var fullUrl = "http://" + self.host + ":" + self.port + "/_stats";

    console.error("Index Checker URL: "+ util.inspect(fullUrl));

	xmlHttp.open("GET", fullUrl, true);
	xmlHttp.send(null);
};

//must specify query fields and words as
//var qryObj = {
//	field : term
//}

IndexConnection.prototype.search = function(typeName,
                                            queryObject,
                                            callback)
{
    let self = this;

    self.client.search(
        {
            index : self.index.short_name,
            type: typeName,
            body : queryObject
        })
        .then(function(response) {
            callback(null, response.hits.hits);
        },function(error){
            error = "Error fetching documents for query : " + JSON.stringify(queryObject) + ". Reported error : " + JSON.stringify(error);
            console.error(error);
            callback(1, error);
        });
};

IndexConnection.prototype.moreLikeThis = function(typeName,
                                                  documentId,
                                                  callback)
{
    let self = this;

    if(documentId != null)
    {
        self.client.search(
            self.index.short_name,
            typeName,
            {
                "query": {
                    "more_like_this": {
                        "docs": [
                            {
                                "_index": self.index.short_name,
                                "_type": typeName,
                                "_id": documentId
                            }
                        ]
                    }
                }
            })
            .then(function(data)
            {
                callback(null, data.hits.hits);
            }, function(error){
                error = "Error fetching documents similar to document with ID : " + documentId + ". Reported error : " + JSON.stringify(error);
                console.error(error);
                callback(1, error);
            });
    }
    else
    {
        const error = "No documentId Specified for similarity calculation";
        console.error(error);
        callback(1, error);
    }
}


/**
 * Exports
 */

IndexConnection.prototype.transformURIintoVarName = function(uri)
{
    var transformedUri = uri.replace(/[^A-z]|[0-9]/g, "_");
    return transformedUri;
}

module.exports.IndexConnection = IndexConnection;
