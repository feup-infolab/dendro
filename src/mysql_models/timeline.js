"use strict";
module.exports = (sequelize, DataTypes) => {
    var timeline = sequelize.define("timeline", {
        userURI: DataTypes.TEXT,
        lastAccess: DataTypes.DATE,
        lastPosition: DataTypes.INTEGER
    }, {});
    timeline.associate = function (models) {
        // associations can be defined here
    };
    return timeline;
};
