var Config = function() { return GLOBAL.Config; }();

var RecommendationUtils = {};

RecommendationUtils.getActiveRecommender = function()
{
    var recommendationModes = Object.keys(Config.recommendation.modes);
    var activeMode;

    for (var i = 0; i < recommendationModes.length; i++)
    {
        var key = recommendationModes[i];
        if (Config.recommendation.modes[key] != null && Config.recommendation.modes[key].active)
        {
            if (!activeMode)
            {
                activeMode = key;
            }
            else
            {
                console.error("[FATAL ERROR] Two recommendation modes are active. Something is wrong with your conf/deployment_configs.json file.");
                process.exit(1);
            }
        }
    }

    return activeMode;
}

module.exports.RecommendationUtils = RecommendationUtils;