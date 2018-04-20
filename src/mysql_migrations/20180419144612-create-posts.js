"use strict";
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable("posts", {
            postURI: {
                allowNull: false,
                primaryKey: true,
                type: Sequelize.STRING
            },
            userURI: {
                type: Sequelize.STRING
            },
            projectURI: {
                type: Sequelize.STRING
            },
            typeId: {
                type: Sequelize.INTEGER,
                references: {
                    model: "post_types",
                    key: "id"
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
        }).then(() => {
            queryInterface.addIndex("posts", ["userURI"]);
            return queryInterface.addIndex("posts", ["projectURI"]);
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable("posts");
    }
};
