module.exports = function(Sequelize, sequelize) {
    return sequelize.define("events", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            userURI: Sequelize.STRING,
            postURI: Sequelize.STRING,
            projectURI: Sequelize.STRING },
        {
            createdAt: 'timestamp',
            updatedAt: 'modified',
            indexes: [
                { fields: ['userURI'] },
                { fields: ['postURI'] },
                { fields: ['projectURI'] }
            ]
        });
};