"use strict";
module.exports = (sequelize, DataTypes) => {
    var timeline = sequelize.define("timeline", {
        userURI: DataTypes.TEXT,
        lastAccess: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        nextPosition: { type: DataTypes.INTEGER, defaultValue: 0 },
        type: DataTypes.TEXT
    }, {});
    timeline.associate = function (models) {
        // associations can be defined here
    };
    return timeline;
};
