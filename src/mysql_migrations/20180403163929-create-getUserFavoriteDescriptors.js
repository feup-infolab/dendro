'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getUserFavoriteDescriptors;").then(() => {
          return queryInterface.sequelize.query("CREATE PROCEDURE getUserFavoriteDescriptors (IN userUri VARCHAR(255))" + " \n" +
              "BEGIN \n" +
              "SELECT DISTINCT favoritesInfo.executedOver, favoritesInfo.created, favoritesInfo.interactionType FROM dendroVagrantDemo.interactions AS favoritesInfo \n" +
              "JOIN dendroVagrantDemo.interactions AS unfavoritesInfo \n" +
              "ON favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user', 'unfavorite_descriptor_from_quick_list_for_user') AND favoritesInfo.performedBy = userUri AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user', 'unfavorite_descriptor_from_quick_list_for_user') AND unfavoritesInfo.performedBy = userUri AND unfavoritesInfo.performedBy = favoritesInfo.performedBy AND favoritesInfo.executedOver = unfavoritesInfo.executedOver \n" +
              "WHERE \n" +
              "(favoritesInfo.created = (SELECT MAX(created) FROM dendroVagrantDemo.interactions WHERE performedBy = userUri AND dendroVagrantDemo.interactions.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user', 'unfavorite_descriptor_from_quick_list_for_user') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user') AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user') AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND dendroVagrantDemo.interactions.executedOver = unfavoritesInfo.executedOver)) \n" +
              "OR (favoritesInfo.created = (SELECT MAX(created) FROM dendroVagrantDemo.interactions WHERE performedBy = userUri AND dendroVagrantDemo.interactions.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user', 'unfavorite_descriptor_from_quick_list_for_user') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_user', 'favorite_descriptor_from_quick_list_for_user') AND unfavoritesInfo.interactionType = 'unfavorite_descriptor_from_quick_list_for_user' AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND dendroVagrantDemo.interactions.executedOver = unfavoritesInfo.executedOver AND  unfavoritesInfo.created < favoritesInfo.created)); \n" +
              "END;");
        });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getUserFavoriteDescriptors;");
    }
};
