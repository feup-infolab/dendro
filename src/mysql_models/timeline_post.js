"use strict";
module.exports = (sequelize, DataTypes) => {
    var timeline_post = sequelize.define("timeline_post", {
        userURI: DataTypes.STRING,
        postURI: DataTypes.STRING,
        timestamp: DataTypes.DATE,
        position: DataTypes.INTEGER
    }, {});
    timeline_post.associate = function (models) {
        // associations can be defined here
    };
    return timeline_post;
};
