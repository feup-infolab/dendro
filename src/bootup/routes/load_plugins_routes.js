const Pathfinder = global.Pathfinder;
let PluginManager = Object.create(require(Pathfinder.absPathInSrcFolder("/plugins/plugin_manager.js")).PluginManager);

const loadRoutes = function (app, callback)
{
    PluginManager.registerPlugins(app, function (err, app)
    {
        callback(err);
    });
};

module.exports.loadRoutes = loadRoutes;
