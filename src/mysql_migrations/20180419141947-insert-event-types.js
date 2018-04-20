"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert("event_types", [
            { name: "like", createdAt: new Date(), updatedAt: new Date() },
            { name: "comment", createdAt: new Date(), updatedAt: new Date() },
            { name: "share", createdAt: new Date(), updatedAt: new Date() }
        ], {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete("event_types", null, {});
    }
};
