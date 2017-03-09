const demouser1 = require("../users/demouser1.js");


//TODO @silvae86
const interactionTemplate = {
    ddr : {
        performedBy : demouser1.uri,
        interactionType : req.body.interactionType,
        executedOver : resource.uri,
        originallyRecommendedFor : req.body.recommendedFor,
        rankingPosition : req.body.rankingPosition,
        pageNumber : req.body.pageNumber,
        recommendationCallId : req.body.recommendationCallId,
        recommendationCallTimeStamp : req.body.recommendationCallTimeStamp
    }
};

let mockInteractions = [];

for(let i = 0; i <  Interaction.types.length;i++)
{

}

module.exports = interactions;