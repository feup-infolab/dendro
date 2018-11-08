"use strict";

module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS countEngagementAndInteractions;").then(() =>
            queryInterface.sequelize.query("CREATE PROCEDURE countEngagementAndInteractions(IN userURI TEXT, IN projects TEXT, IN lastAccess TEXT)\n" +
                "BEGIN\n" +
                "SET @sql = CONCAT('\n" +
                "SELECT posts.postURI AS uri, posts.projectURI, posts.userURI AS authorURI, CAST(posts.createdAt AS DATETIME) AS created, CAST(SUM(if(events.typeId = 1, 1, 0)) AS UNSIGNED) AS likes, CAST(SUM(if(events.typeId = 2, 1, 0)) AS UNSIGNED) AS comments, CAST(SUM(if(events.typeId = 3, 1, 0)) AS UNSIGNED) AS shares, post_types.name AS postType\n" +
                "FROM events INNER JOIN posts ON posts.postURI = events.postURI INNER JOIN post_types ON posts.typeId = post_types.id\n" +
                "WHERE posts.projectURI IN (', projects, ') AND posts.updatedAt >=', lastAccess,'\n" +
                "GROUP BY events.postURI, posts.projectURI');\n" +
                "PREPARE stmt FROM @sql;\n" +
                "EXECUTE stmt;\n" +
                "DEALLOCATE PREPARE stmt;\n" +
                "    \n" +
                "    SET @sql = CONCAT('\n" +
                "SELECT posts.projectURI, COUNT(*) AS interactions\n" +
                "FROM events INNER JOIN posts ON posts.postURI = events.postURI\n" +
                "WHERE events.userURI = ', userURI, ' AND posts.projectURI IN (', projects, ')\n" +
                "                    GROUP BY posts.projectURI');\n" +
                "PREPARE stmt FROM @sql;\n" +
                "EXECUTE stmt;\n" +
                "DEALLOCATE PREPARE stmt;\n" +
                "    \n" +
                "END")),

    down: (queryInterface, Sequelize) =>
        queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS countEngagementAndInteractions;")
};
