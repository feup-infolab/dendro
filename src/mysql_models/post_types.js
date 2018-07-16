"use strict";
module.exports = (sequelize, DataTypes) =>
{
    var post_types = sequelize.define("post_types", {
        name: DataTypes.STRING
    }, {});
    post_types.associate = function (models)
    {
        // associations can be defined here
    };
    return post_types;
};
