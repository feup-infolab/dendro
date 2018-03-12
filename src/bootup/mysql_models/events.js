module.exports = function(Sequelize, sequelize) {
    return sequelize.define("events", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            type: Sequelize.STRING,
            userURI: Sequelize.STRING,
            postURI: Sequelize.STRING,
            projectURI: Sequelize.STRING },
        {
            createdAt: 'timestamp',
            updatedAt: 'modified',
            indexes: [
                { fields: ['type'] },
                { fields: ['userURI'] },
                { fields: ['postURI'] },
                { fields: ['projectURI'] }
            ]
        });
};