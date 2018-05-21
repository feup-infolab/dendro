"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("timelines", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userURI: {
                allowNull: false,
                type: Sequelize.TEXT
            },
            lastAccess: {
                allowNull: false,
                defaultValue: queryInterface.sequelize.fn("NOW"),
                type: Sequelize.DATE
            },
            nextPosition: {
                allowNull: false,
                defaultValue: 0,
                type: Sequelize.INTEGER
            },
            type: {
                allowNull: false,
                type: Sequelize.TEXT
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("timelines");
    }
};
