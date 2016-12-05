//DCTerms ontology : "http://purl.org/dc/elements/1.1/"

var Config = function() { return GLOBAL.Config; }();
var Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
var DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
var Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

var db = function() { return GLOBAL.db.default; }();
var gfs = function() { return GLOBAL.gfs.default; }();

var async = require('async');

function ExternalRepository (object, creatorUsername)
{
    ExternalRepository.baseConstructor.call(this, object);
    var self = this;

    self.rdf.type = "ddr:ExternalRepository";

    var slug = require('slug');

    if(object.uri == null)
    {
        if(creatorUsername != null && self.dcterms.title != null)
        {
            self.uri = Config.baseUri + "/external_repository/" + creatorUsername + "/" + slug(self.dcterms.title);
        }
        else
        {
            var error = "Unable to create an external repository resource without specifying its creator and its dcterms:title";
            console.error(error);
            return {error : error};
        }
    }

    return self;
}

ExternalRepository.findByCreator = function(creatorUri, callback)
{
    var query =
        "SELECT ?uri \n" +
            "FROM [0] \n" +
            "WHERE { \n" +
                "{ \n" +
                " ?uri rdf:type ddr:ExternalRepository . "+
                " ?uri dcterms:creator [1] \n"+
                "} \n" +
            "} \n";

    db.connection.execute(query,
        [
            {
                type : DbConnection.resourceNoEscape,
                value : db.graphUri
            },
            {
                type : DbConnection.resource,
                value : creatorUri
            }
        ],
        function(err, rows) {
            if(!err)
            {
                if(rows instanceof Array)
                {
                    var getExternalRepository = function(resultRow, cb)
                    {
                        ExternalRepository.findByUri(resultRow.uri, function(err, externalRepository)
                        {
                            cb(err, externalRepository);
                        });
                    };

                    async.map(rows, getExternalRepository, function(err, externalRepositories)
                    {
                        callback(err, externalRepositories);
                    });
                }
                else
                {
                    //external repository does not exist, return null
                    callback(0, null);
                }
            }
            else
            {
                callback(err, [rows]);
            }
    });
};

ExternalRepository = Class.extend(ExternalRepository, Resource);

module.exports.ExternalRepository = ExternalRepository;