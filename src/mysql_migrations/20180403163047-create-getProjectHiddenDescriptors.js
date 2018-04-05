'use strict';

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

module.exports = {
    up: (queryInterface, Sequelize) => {
        const tableName = Config.mySQLDBName + ".interactions";
        return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getProjectHiddenDescriptors;").then(() => {
            return queryInterface.sequelize.query("CREATE PROCEDURE getProjectHiddenDescriptors (IN projectUri VARCHAR(255))" + " \n" +
                "BEGIN \n" +
                "SELECT DISTINCT hiddenInfo.executedOver, hiddenInfo.created, hiddenInfo.interactionType FROM " + tableName + " AS hiddenInfo \n" +
                "JOIN " + tableName + " AS unhiddenInfo \n"+
                "ON hiddenInfo.interactionType in ('hide_descriptor_from_quick_list_for_project', 'unhide_descriptor_from_quick_list_for_project') AND hiddenInfo.projectUri = projectUri AND unhiddenInfo.interactionType in ('hide_descriptor_from_quick_list_for_project', 'unhide_descriptor_from_quick_list_for_project') AND unhiddenInfo.projectUri = projectUri AND unhiddenInfo.projectUri = hiddenInfo.projectUri AND hiddenInfo.executedOver = unhiddenInfo.executedOver \n" +
                "WHERE \n" +
                "(hiddenInfo.created = (SELECT MAX(created) FROM " + tableName + " WHERE projectUri = projectUri AND " + tableName + ".interactionType in ('hide_descriptor_from_quick_list_for_project', 'unhide_descriptor_from_quick_list_for_project') AND hiddenInfo.interactionType in ('hide_descriptor_from_quick_list_for_project') AND unhiddenInfo.interactionType in ('hide_descriptor_from_quick_list_for_project') AND unhiddenInfo.executedOver = hiddenInfo.executedOver AND " + tableName + ".executedOver = hiddenInfo.executedOver)) \n" +
                "OR (hiddenInfo.created = (SELECT MAX(created) FROM " + tableName + " WHERE projectUri = projectUri AND " + tableName + ".interactionType in ('hide_descriptor_from_quick_list_for_project', 'unhide_descriptor_from_quick_list_for_project') AND hiddenInfo.interactionType in ('hide_descriptor_from_quick_list_for_project') AND unhiddenInfo.interactionType in ('unhide_descriptor_from_quick_list_for_project') AND unhiddenInfo.executedOver = hiddenInfo.executedOver AND " + tableName + ".executedOver = hiddenInfo.executedOver AND  unhiddenInfo.created < hiddenInfo.created)); \n" +
                "END;");
        })
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getProjectHiddenDescriptors;");
    }
};
