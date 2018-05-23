"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert("post_types", [
            { name: "manual", createdAt: new Date(), updatedAt: new Date() },
            { name: "metadata_change", createdAt: new Date(), updatedAt: new Date() },
            { name: "file_upload", createdAt: new Date(), updatedAt: new Date() },
            { name: "file_delete", createdAt: new Date(), updatedAt: new Date() },
            { name: "rmdir", createdAt: new Date(), updatedAt: new Date() },
            { name: "mkdir", createdAt: new Date(), updatedAt: new Date() },
            { name: "share", createdAt: new Date(), updatedAt: new Date() }
        ], {});
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete("post_types", null, {});
    }
};
