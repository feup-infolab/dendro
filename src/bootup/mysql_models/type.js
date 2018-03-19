module.exports = function(Sequelize, sequelize) {
    return sequelize.define("type", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: Sequelize.STRING, unique: true }
        },
        {
            indexes: [
                { fields: ['name'] }
            ]
        });
};