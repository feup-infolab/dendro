'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('interactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            uri: {
                type: Sequelize.STRING
            },
            projectUri: {
                type: Sequelize.STRING
            },
            performedBy: {
                type: Sequelize.STRING
            },
            interactionType: {
                type: Sequelize.STRING
            },
            executedOver: {
                type: Sequelize.STRING
            },
            originallyRecommendedFor: {
                type: Sequelize.STRING
            },
            rankingPosition: {
                type: Sequelize.INTEGER,
                defaultValue: null
            },
            pageNumber: {
                type: Sequelize.INTEGER,
                defaultValue: null
            },
            recommendationCallId: {
                type: Sequelize.TEXT,
                defaultValue: null
            },
            recommendationCallTimeStamp: {
                type: Sequelize.DATE,
                defaultValue: null
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        }).then(() => {
            queryInterface.addIndex('interactions', ['uri']);
            queryInterface.addIndex('interactions', ['performedBy']);
            queryInterface.addIndex('interactions', ['interactionType']);
            queryInterface.addIndex('interactions', ['executedOver']);
            queryInterface.addIndex('interactions', ['originallyRecommendedFor']);
            queryInterface.addIndex('interactions', ['projectUri', 'interactionType', 'executedOver']);
            queryInterface.addIndex('interactions', ['performedBy', 'interactionType', 'executedOver']);
            queryInterface.renameColumn('interactions', 'createdAt', 'created').then(() => { queryInterface.addIndex('interactions', ['created']); });
            return queryInterface.renameColumn('interactions', 'updatedAt', 'modified');
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('interactions');
    }
};