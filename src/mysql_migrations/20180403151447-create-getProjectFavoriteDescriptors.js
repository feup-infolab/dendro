'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getProjectFavoriteDescriptors;").then(() => {
          /*
          return queryInterface.sequelize.query("CREATE PROCEDURE getProjectFavoriteDescriptors (IN projectUri VARCHAR(255))" + " \n" +
              "BEGIN \n" +
              "SELECT DISTINCT favoritesInfo.executedOver, favoritesInfo.created, favoritesInfo.interactionType FROM interactions AS favoritesInfo \n" +
              "JOIN interactions AS unfavoritesInfo \n" +
              "ON favoritesInfo.interactionType in \n" +
              "('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
              "AND favoritesInfo.projectUri = projectUri AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
              "AND unfavoritesInfo.projectUri = projectUri AND unfavoritesInfo.projectUri = favoritesInfo.projectUri AND favoritesInfo.executedOver = unfavoritesInfo.executedOver \n" +
              "WHERE \n" +
              "(favoritesInfo.created = (SELECT MAX(created) FROM interactions WHERE projectUri = projectUri AND interactions.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND interactions)) OR (favoritesInfo.created = (SELECT MAX(created) FROM interactions WHERE projectUri = projectUri AND interactions.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType = 'unfavorite_descriptor_from_quick_list_for_project' AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND interactions.executedOver = favoritesInfo.executedOver AND  unfavoritesInfo.created < favoritesInfo.created)); \n" +
              "END;");
          */
          return queryInterface.sequelize.query("CREATE PROCEDURE getProjectFavoriteDescriptors (IN projectUri VARCHAR(255))" + " \n" +
              "BEGIN \n" +
              "SELECT DISTINCT favoritesInfo.executedOver, favoritesInfo.created, favoritesInfo.interactionType FROM interactions AS favoritesInfo \n" +
              "JOIN interactions AS unfavoritesInfo \n" +
              "ON favoritesInfo.interactionType in \n" +
              "('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
              "AND favoritesInfo.projectUri = projectUri AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') \n" +
              "AND unfavoritesInfo.projectUri = projectUri AND unfavoritesInfo.projectUri = favoritesInfo.projectUri AND favoritesInfo.executedOver = unfavoritesInfo.executedOver \n" +
              "WHERE \n" +
              "(favoritesInfo.created = (SELECT MAX(created) FROM interactions WHERE projectUri = projectUri AND interactions.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND interactions.executedOver = favoritesInfo.executedOver)) \n" +
              "OR (favoritesInfo.created = (SELECT MAX(created) FROM interactions WHERE projectUri = projectUri AND interactions.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project', 'unfavorite_descriptor_from_quick_list_for_project') AND favoritesInfo.interactionType in ('favorite_descriptor_from_manual_list_for_project', 'favorite_descriptor_from_quick_list_for_project') AND unfavoritesInfo.interactionType = 'unfavorite_descriptor_from_quick_list_for_project' AND unfavoritesInfo.executedOver = favoritesInfo.executedOver AND interactions.executedOver = favoritesInfo.executedOver AND  unfavoritesInfo.created < favoritesInfo.created)); \n" +
              "END");
      });
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query("DROP PROCEDURE IF EXISTS getProjectFavoriteDescriptors;");
  }
};
