'use strict';
module.exports = (sequelize, DataTypes) => {
    var events = sequelize.define('events', {
        userURI: DataTypes.STRING,
        postURI: DataTypes.STRING,
        projectURI: DataTypes.STRING
    });
    events.associate = function(models) {
        events.belongsTo(models.type);
    };
    return events;
};