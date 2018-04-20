"use strict";
module.exports = (sequelize, DataTypes) => {
    var interactions = sequelize.define("interactions", {
        uri: DataTypes.STRING,
        projectUri: DataTypes.STRING,
        performedBy: DataTypes.STRING,
        interactionType: DataTypes.STRING,
        executedOver: DataTypes.STRING,
        originallyRecommendedFor: DataTypes.STRING,
        rankingPosition: { type: DataTypes.INTEGER, defaultValue: null },
        pageNumber: { type: DataTypes.INTEGER, defaultValue: null },
        recommendationCallId: { type: DataTypes.TEXT, defaultValue: null },
        recommendationCallTimeStamp: { type: DataTypes.DATE, defaultValue: null }
    }, {
        createdAt: "created",
        updatedAt: "modified",
        indexes: [
            { fields: ["uri"] },
            { fields: ["performedBy"] },
            { fields: ["interactionType"] },
            { fields: ["executedOver"] },
            { fields: ["originallyRecommendedFor"] },
            { fields: ["projectUri", "interactionType", "executedOver"] },
            { fields: ["performedBy", "interactionType", "executedOver"] },
            { fields: ["created"] }
        ]
    }, {
        createdAt: "created",
        updatedAt: "modified"
    });
    interactions.associate = function (models) {
        // associations can be defined here
    };
    return interactions;
};
