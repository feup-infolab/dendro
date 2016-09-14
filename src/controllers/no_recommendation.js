var Config = require('../models/meta/config.js').Config;

exports.recommend_descriptors = function(req, res) {
    res.json(
        {
            result : "ok",
            descriptors : []
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
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    callback(null, []);
};