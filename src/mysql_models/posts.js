"use strict";
module.exports = (sequelize, DataTypes) => {
    var posts = sequelize.define("posts", {
        userURI: DataTypes.STRING,
        postURI: { type: DataTypes.STRING, primaryKey: true },
        projectURI: DataTypes.STRING,
        typeId: DataTypes.INTEGER
    }, {});
    posts.associate = function (models) {
        posts.belongsTo(models.post_types);
    };
    return posts;
};
