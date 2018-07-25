"use strict";

module.exports = {
    up: (queryInterface, Sequelize) =>
        queryInterface.bulkInsert("event_types", [
            { name: "like", createdAt: new Date(), updatedAt: new Date() },
            { name: "comment", createdAt: new Date(), updatedAt: new Date() },
            { name: "share", createdAt: new Date(), updatedAt: new Date() },
            { name: "post", createdAt: new Date(), updatedAt: new Date() }
        ], {}),

    down: (queryInterface, Sequelize) =>
        queryInterface.bulkDelete("event_types", null, {})
};
