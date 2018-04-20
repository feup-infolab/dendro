"use strict";
module.exports = (sequelize, DataTypes) => {
    var event_types = sequelize.define("event_types", {
        name: DataTypes.STRING
    }, {});
    event_types.associate = function (models) {
        // associations can be defined here
    };
    return event_types;
};
