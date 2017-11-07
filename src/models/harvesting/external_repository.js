const path = require('path');
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const isNull = require(Pathfinder.absPathInSrcFolder('/utils/null.js')).isNull;
const Class = require(Pathfinder.absPathInSrcFolder('/models/meta/class.js')).Class;
const Elements = require(Pathfinder.absPathInSrcFolder('/models/meta/elements.js')).Elements;
const Resource = require(Pathfinder.absPathInSrcFolder('/models/resource.js')).Resource;

const db = Config.getDBByID();

const async = require('async');

function ExternalRepository (object)
{
    const self = this;
    self.addURIAndRDFType(object, 'external_repository', ExternalRepository);
    ExternalRepository.baseConstructor.call(this, object);

    const slug = require('slug');

    if (isNull(self.ddr.humanReadableUri))
    {
        if (!isNull(object.dcterms.creator) && !isNull(self.dcterms.title))
        {
            self.humanReadableURI = Config.baseUri + '/external_repository/' + object.dcterms.creator + '/' + slug(self.dcterms.title);
        }
        else
        {
            const error = 'Unable to create an external repository resource without specifying its creator and its dcterms:title';
            console.error(error);
            return {error: error};
        }
    }

    return self;
}

ExternalRepository.findByCreator = function (creatorUri, callback)
{
    const query =
        'SELECT ?uri \n' +
        'FROM [0] \n' +
        'WHERE { \n' +
        '{ \n' +
        ' ?uri rdf:type ddr:ExternalRepository . ' +
        ' ?uri dcterms:creator [1] \n' +
        '} \n' +
        '} \n';

    db.connection.executeViaJDBC(query,
        [
            {
                type: Elements.types.resourceNoEscape,
                value: db.graphUri
            },
            {
                type: Elements.types.resource,
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

ExternalRepository = Class.extend(ExternalRepository, Resource, 'ddr:ExternalRepository');

module.exports.ExternalRepository = ExternalRepository;
