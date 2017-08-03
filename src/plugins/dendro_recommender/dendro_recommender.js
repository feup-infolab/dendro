const path = require("path");
const Pathfinder = global.Pathfinder;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

var Class = require(Pathfinder.absPathInSrcFolder("/models/meta/class.js")).Class;
var Plugin = require(Pathfinder.absPathInSrcFolder("/plugins/plugin.js")).Plugin;
var Permissions = require(Pathfinder.absPathInSrcFolder("/models/meta/permissions.js")).Permissions;

var DendroRecommender = function()
{
    var self = this;
    return self;
};

DendroRecommender.setup = function(app)
{
    var self = this;
    var pluginRootFolder = self.getPluginRootFolder();

    var interactions = require(path.join(pluginRootFolder, "package", "controllers", "interactions.js"));

    app = DendroRecommender.registerRoute(app, 'POST', 'push_interactions/from/:starting_instant_in_iso_format',[Permissions.settings.role.in_system.user], interactions.refresh_interactions);
    app = DendroRecommender.registerRoute(app, 'POST', 'push_interactions/all', [Permissions.settings.role.in_system.user], interactions.refresh_interactions);
    app = DendroRecommender.registerRoute(app, 'POST', 'push_interactions/random', [Permissions.settings.role.in_system.user], interactions.generate_random_interactions);
    app = DendroRecommender.registerRoute(app, 'GET', 'interactions/user/:username', [Permissions.settings.role.in_system.user], interactions.by_user);
    //app = DendroRecommender.registerRoute(app, 'POST', new RegExp('project\/([^\/]+)(\/data)?$'), [Permissions.role.creator_or_contributor], interactions.register);

    /**
     * If the plugin has to serve its own static files (JS files, for example, register route).
     */
    app = self.registerStaticFilesRoute(app);

    return app;
};

/*
"Static" methods and fields
 */

/**
 * Need to overload the .config attribute in every plugin
 * @type {Object|*}
 */
DendroRecommender.config = require(path.join(__dirname, "integration", "config.json"));

DendroRecommender = Class.extend(DendroRecommender, Plugin, true);

module.exports.DendroRecommender = DendroRecommender;