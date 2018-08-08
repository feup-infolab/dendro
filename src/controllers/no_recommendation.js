const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Elements = rlequire("dendro", "src/models/meta/elements.js").Elements;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

exports.recommend_descriptors = function (req, res)
{
    res.json(
        {
            result: "ok",
            descriptors: []
        }
    );
};

exports.shared = {};

/**
 * Recommends a page of descriptors
 * @param resourceUri
 * @param userUri
 * @param page
 * @param allowedOntologies
 * @param indexConnection
 * @param callback
 * @param options favorites_only : choose from favorite descriptors only
 */

exports.shared.recommendation_options = {
    favorites: "favorites",
    smart: "smart",
    hidden: "hidden"
};

exports.shared.recommend_descriptors = function (resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    return callback(null, []);
};
