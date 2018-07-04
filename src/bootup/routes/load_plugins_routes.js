const rlequire = require("rlequire");
let PluginManager = Object.create(rlequire("dendro", "src/plugins/plugin_manager.js").PluginManager);

const loadRoutes = function (app, callback)
{
    PluginManager.registerPlugins(app, function (err, app)
    {
        callback(err);
    });
};

module.exports.loadRoutes = loadRoutes;
