"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("events", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userURI: {
                type: Sequelize.STRING
            },
            typeId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "event_types",
                    key: "id"
                }
            },
            postURI: {
                type: Sequelize.STRING,
                references: {
                    model: "posts",
                    key: "postURI"
                }
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
        return queryInterface.dropTable("events");
    }
};
