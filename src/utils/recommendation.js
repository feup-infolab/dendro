const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const RecommendationUtils = {};

RecommendationUtils.getActiveRecommender = function ()
{
    const recommendationModes = Object.keys(Config.recommendation.modes);
    let activeMode;

    for (let i = 0; i < recommendationModes.length; i++)
    {
        const key = recommendationModes[i];
        if (!isNull(Config.recommendation.modes[key]) && Config.recommendation.modes[key].active)
        {
            if (!activeMode)
            {
                activeMode = key;
            }
            else
            {
                throw new Error("[FATAL ERROR] Two recommendation modes are active. Something is wrong with your " + Config.activeConfigFilePath + " file.");
            }
        }
    }

    return activeMode;
};

module.exports.RecommendationUtils = RecommendationUtils;
