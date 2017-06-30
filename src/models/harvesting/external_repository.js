//DCTerms ontology : "http://purl.org/dc/elements/1.1/"

const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
const Class = require(Config.absPathInSrcFolder("/models/meta/class.js")).Class;
const DbConnection = require(Config.absPathInSrcFolder("/kb/db.js")).DbConnection;
const Resource = require(Config.absPathInSrcFolder("/models/resource.js")).Resource;

const db = function () {
    return global.db.default;
}();

const async = require('async');

function ExternalRepository (object, creatorUsername)
{
    ExternalRepository.baseConstructor.call(this, object, ExternalRepository);
    const self = this;

    const slug = require('slug');

    if(isNull(self.uri))
    {
        const uuid = require('uuid');
        self.uri = "/r/external_repository/" + uuid.v4();
    }

    if(isNull(self.ddr.humanReadableUri))
    {
        if(!isNull(creatorUsername) && !isNull(self.dcterms.title))
        {
            self.humanReadableURI = Config.baseUri + "/external_repository/" + creatorUsername + "/" + slug(self.dcterms.title);
        }
        else
        {
            const error = "Unable to create an external repository resource without specifying its creator and its dcterms:title";
            console.error(error);
            return {error : error};
        }
    }

    return self;
}

ExternalRepository.findByCreator = function(creatorUri, callback)
{
    const query =
        "SELECT ?uri \n" +
        "FROM [0] \n" +
        "WHERE { \n" +
        "{ \n" +
        " ?uri rdf:type ddr:ExternalRepository . " +
        " ?uri dcterms:creator [1] \n" +
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
                    const getExternalRepository = function (resultRow, cb) {
                        ExternalRepository.findByUri(resultRow.uri, function (err, externalRepository) {
                            cb(err, externalRepository);
                        });
                    };

                    async.map(rows, getExternalRepository, function(err, externalRepositories)
                    {
                        return callback(err, externalRepositories);
                    });
                }
                else
                {
                    //external repository does not exist, return null
                    return callback(0, null);
                }
            }
            else
            {
                return callback(err, [rows]);
            }
    });
};

ExternalRepository = Class.extend(ExternalRepository, Resource, "ddr:ExternalRepository");

module.exports.ExternalRepository = ExternalRepository;