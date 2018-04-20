"use strict";
module.exports = (sequelize, DataTypes) => {
    var type = sequelize.define("types", {
        name: { type: DataTypes.STRING, unique: true }
    });
    type.associate = function (models) {
        // associations can be defined here
    };
    return type;
};
