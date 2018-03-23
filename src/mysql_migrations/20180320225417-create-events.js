'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('events', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userURI: {
                type: Sequelize.STRING
            },
            postURI: {
                type: Sequelize.STRING
            },
            projectURI: {
                type: Sequelize.STRING
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            typeId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'types',
                    key: 'id'
                }
            }
        }).then(() => {
            queryInterface.addIndex('events', ['userURI']);
            queryInterface.addIndex('events', ['postURI']);
            queryInterface.addIndex('events', ['projectURI']);
            queryInterface.renameColumn('events', 'createdAt', 'timestamp');
            return queryInterface.renameColumn('events', 'updatedAt', 'modified');
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('events');
    }
};