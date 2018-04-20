"use strict";
module.exports = (sequelize, DataTypes) => {
    var events = sequelize.define("events", {
        userURI: DataTypes.STRING,
        typeId: DataTypes.INTEGER,
        postURI: DataTypes.STRING
    }, {});
    events.associate = function (models) {
        events.belongsTo(models.event_types);
        events.belongsTo(models.posts);
    };
    return events;
};
