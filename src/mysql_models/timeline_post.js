"use strict";
module.exports = (sequelize, DataTypes) => {
    var timeline_post = sequelize.define("timeline_post", {
        timelineId: DataTypes.INTEGER,
        postURI: DataTypes.STRING,
        position: DataTypes.INTEGER,
        fixedPosition: DataTypes.INTEGER,
        timestampFixed: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {});
    timeline_post.associate = function (models) {
        timeline_post.belongsTo(models.timeline);
    };
    return timeline_post;
};
