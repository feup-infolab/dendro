const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Permissions = Object.create(rlequire("dendro", "src/models/meta/permissions.js").Permissions);
const DockerManager = Object.create(rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager);

const notebooks = rlequire("dendro", "src/controllers/notebooks");

let async = require("async");

const loadRoutes = function (app, callback)
{
    // notebook

    if (Config.notebooks.active)
    {
        // TODO fix this activate
        app.all(/\/notebook_runner\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(.*)?/,
            async.apply(Permissions.require, [Permissions.settings.role.in_system.user]),
            async.apply(DockerManager.requireOrchestras, ["dendro_notebook_vhosts"]),
            notebooks.pipe_to_instance);
    }

    callback(null);
};

module.exports.loadRoutes = loadRoutes;
