var Config = function() { return GLOBAL.Config; }();

exports.recommend_descriptors = function(req, res) {
    res.json(
        {
            result : "ok",
            descriptors : []
        }
    );
};

exports.shared = {};

exports.shared.recommendation_options = {
    favorites : "favorites",
    smart : "smart",
    hidden : "hidden"
};

exports.shared.recommend_descriptors = function(resourceUri, userUri, page, allowedOntologies, indexConnection, callback, options)
{
    callback(null, []);
};