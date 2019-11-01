const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Class = rlequire("dendro", "src/models/meta/class.js").Class;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const Resource = rlequire("dendro", "src/models/resource.js").Resource;

const db = Config.getDBByID();

const async = require("async");

function ExternalRepository (object = {})
{
    const self = this;
    self.addURIAndRDFType(object, "external_repository", ExternalRepository);
    ExternalRepository.baseConstructor.call(this, object);
    return self;
}

ExternalRepository.findByCreator = function (creatorUri, callback)
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

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.ontologies.dcterms.creator.type,
                value: creatorUri
            }
        ],
        function (err, rows)
        {
            if (isNull(err))
            {
                if (rows instanceof Array)
                {
                    const getExternalRepository = function (resultRow, cb)
                    {
                        ExternalRepository.findByUri(resultRow.uri, function (err, externalRepository)
                        {
                            cb(err, externalRepository);
                        });
                    };

                    async.mapSeries(rows, getExternalRepository, function (err, externalRepositories)
                    {
                        return callback(err, externalRepositories);
                    });
                }
                else
                {
                    // external repository does not exist, return null
                    return callback(null, null);
                }
            }
            else
            {
                return callback(err, [rows]);
            }
        });
};

ExternalRepository.prototype.getHumanReadableUri = function (callback)
{
    const self = this;

    if (isNull(self.ddr.humanReadableUri))
    {
        if (!isNull(self.dcterms.creator) && !isNull(self.dcterms.title))
        {
            const slug = rlequire("dendro", "src/utils/slugifier.js");
            callback(null, "/external_repository" + self.dcterms.creator + "/" + slug(self.dcterms.title));
        }
        else
        {
            const error = "Unable to create an external repository resource without specifying its creator and its dcterms:title";
            Logger.log("error", error);
            callback(1, error);
        }
    }
};

ExternalRepository = Class.extend(ExternalRepository, Resource, "ddr:ExternalRepository");

module.exports.ExternalRepository = ExternalRepository;
