const path = require("path");
const rlequire = require("rlequire");
const IndexConnection = rlequire("dendro", "src/kb/index.js").IndexConnection;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Ontology = rlequire("dendro", "src/models/meta/ontology.js").Ontology;
const Descriptor = rlequire("dendro", "src/models/meta/descriptor.js").Descriptor;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const _ = require("underscore");
const async = require("async");

exports.recommend_descriptors = function (req, res)
{
    const acceptsHTML = req.accepts("html");
    let acceptsJSON = req.accepts("json");

    if (!acceptsJSON && acceptsHTML)
    {
        res.status(400).json({
            result: "error",
            message: "HTML Request not valid for this route."
        });
    }
    else
    {
        const resourceUri = req.params.requestedResourceUri;
        let userUri = null;

        if (!isNull(req.user))
        {
            userUri = req.user.uri;
        }

        const allowedOntologies = _.map(Config.public_ontologies, function (prefix)
        {
            return Ontology.allOntologies[prefix].uri;
        });

        const indexConnection = IndexConnection.getDefault();

        exports.shared.recommend_descriptors(resourceUri, userUri, req.query.page, allowedOntologies, indexConnection, function (err, descriptors)
        {
            if (isNull(err))
            {
                res.json(
                    {
                        result: "ok",
                        descriptors: descriptors
                    }
                );
            }
            else
            {
                res.status(500).json({
                    result: "error",
                    message: "There was an error fetching the descriptors",
                    error: descriptors
                });
            }
        }, {
            page_number: req.query.page,
            page_size: req.query.page_size
        });
    }
};

exports.shared = {};

exports.shared.recommendation_options = {
    favorites: "favorites",
    smart: "smart",
    hidden: "hidden"
};

exports.shared.recommend_descriptors = function (resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    if (isNull(allowedOntologies))
    {
        allowedOntologies = _.map(Config.public_ontologies, function (prefix)
        {
            return Ontology.allOntologies[prefix].uri;
        });
    }

    Descriptor.all_in_ontologies(allowedOntologies, function (err, descriptors)
    {
        if (isNull(err))
        {
            const uuid = require("uuid");
            const recommendation_call_id = uuid.v4();
            const recommendation_call_timestamp = new Date().toISOString();

            for (let i = 0; i < descriptors.length; i++)
            {
                descriptors[i].recommendation_types = {};
                descriptors[i].recommendation_types[Descriptor.recommendation_types.project_descriptors.key] = true;
                descriptors[i].recommendationCallId = recommendation_call_id;
                descriptors[i].recommendationCallTimeStamp = recommendation_call_timestamp;
            }

            return callback(null, descriptors);
        }
        return callback(err, []);
    }, options.page_number, options.page_size);
};
