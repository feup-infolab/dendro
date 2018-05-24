"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("timeline_posts", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            timelineId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "timelines",
                    key: "id"
                }
            },
            postURI: {
                type: Sequelize.TEXT
            },
            position: {
                type: Sequelize.INTEGER
            },
            fixedPosition: {
                type: Sequelize.INTEGER
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
        return queryInterface.dropTable("timeline_posts");
    }
};
