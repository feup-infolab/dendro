const needle = require("needle");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const connectToRecommender = function (app, callback)
{
    if (Config.recommendation.modes.dendro_recommender.active)
    {
        Logger.log_boot_message("info", "Testing connection to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " ...");

        const checkUri = "http://" + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "/about";
        // using callback
        needle.get(checkUri, {
            accept: "application/json"
        },
        function (error, response)
        {
            if (isNull(error))
            {
                Logger.log_boot_message("success", "Successfully connected to Dendro Recommender instance, version " + response.body.version + " at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + " :-)");
                return callback(null);
            }

            return callback("[ERROR] Unable to connect to Dendro Recommender at " + Config.recommendation.modes.dendro_recommender.host + ":" + Config.recommendation.modes.dendro_recommender.port + "! Aborting startup.");
        });
    }
    else
    {
        return callback(null);
    }
};

module.exports.connectToRecommender = connectToRecommender;
