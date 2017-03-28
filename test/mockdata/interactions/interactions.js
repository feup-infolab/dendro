const demouser1 = require("../users/demouser1.js");
const folder = require("../folders/folder.js");


//TODO
const interactionTemplate = {
    ddr : {
        performedBy : demouser1.uri,
        interactionType : "accept_descriptor_from_quick_list",
        executedOver : resource.uri,
        originallyRecommendedFor : folder.uri,
        rankingPosition : 1,
        pageNumber : 0,
        recommendationCallId : "ID_ID_ID",
        recommendationCallTimeStamp : "2017-03-24T18:34:57Z"
    }
};

let interactions = [];

for(let i = 0; i <  Interaction.types.length;i++)
{
    interactionTemplate.interactionType = Interaction.types[i].key;
    interactions.push(JSON.parse(JSON.stringify(interactionTemplate)));
}

module.exports = interactions;