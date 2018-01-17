const path = require("path");
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const demouser1 = require("../users/demouser1.js");
const folder = require("../folders/folder.js");

const dcAbstractDescriptor = require("../descriptors/dcterms_abstract");
const Interaction = require(Pathfinder.absPathInSrcFolder("/models/recommendation/interaction.js")).Interaction;

// TODO
const interactionTemplate = {
    ddr: {
        performedBy: demouser1.uri,
        interactionType: "accept_descriptor_from_quick_list",
        executedOver: dcAbstractDescriptor.uri,
        originallyRecommendedFor: folder.uri,
        rankingPosition: 1,
        pageNumber: 0,
        recommendationCallId: "ID_ID_ID",
        recommendationCallTimeStamp: "2017-03-24T18:34:57Z"
    }
};

let interactions = [];

for (let i = 0; i < Object.keys(Interaction.types).length; i++)
{
    interactionTemplate.ddr.interactionType = Object.keys(Interaction.types)[i];
    interactions.push(JSON.parse(JSON.stringify(interactionTemplate)));
}

module.exports = interactions;
