module.exports = function(Sequelize, sequelize, tableName) {
    return sequelize.define(tableName, {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            uri: Sequelize.STRING,
            performedBy: Sequelize.STRING,
            interactionType: Sequelize.STRING,
            executedOver: Sequelize.STRING,
            originallyRecommendedFor: Sequelize.STRING,
            rankingPosition: { type: Sequelize.INTEGER, defaultValue: null },
            pageNumber: { type: Sequelize.INTEGER, defaultValue: null },
            recommendationCallId: { type: Sequelize.TEXT, defaultValue: null },
            recommendationCallTimeStamp: { type: Sequelize.DATE, defaultValue: null } },
        {
            createdAt: 'created',
            updatedAt: 'modified',
            indexes: [
                { fields: ['uri'] },
                { fields: ['performedBy'] },
                { fields: ['interactionType'] },
                { fields: ['executedOver'] },
                { fields: ['originallyRecommendedFor'] }
            ]
        });
};