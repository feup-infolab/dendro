var path = require('path');

const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
var Class = require(Config.absPathInSrcFolder("models/meta/class.js")).Class;
var Plugin = require(Config.absPathInSrcFolder("plugins/plugin.js")).Plugin;
var Permissions = require(Config.absPathInSrcFolder("models/meta/permissions.js")).Permissions;

var DendroInteraction2CSV = function()
{
    var self = this;
    return self;
};

DendroInteraction2CSV.setup = function(app)
{
    var self = this;
    var pluginRootFolder = self.getPluginRootFolder();

    var csv_generator = require(path.join(pluginRootFolder, "package", "controllers", "csv_generator.js"));

    app = DendroInteraction2CSV.registerRoute(app, 'GET', '/', [Permissions.settings.role.in_system.admin], csv_generator.home);
    app = DendroInteraction2CSV.registerRoute(app, 'GET', 'all', [Permissions.settings.role.in_system.admin], csv_generator.all);
    app = DendroInteraction2CSV.registerRoute(app, 'GET', 'average_metadata_sheet_size_per_interaction', [Permissions.settings.role.in_system.admin], csv_generator.average_metadata_sheet_size_per_interaction);
    app = DendroInteraction2CSV.registerRoute(app, 'GET', 'average_descriptor_length_per_interaction', [Permissions.settings.role.in_system.admin], csv_generator.average_descriptor_length_per_interaction);
    app = DendroInteraction2CSV.registerRoute(app, 'GET', 'total_number_of_descriptors_per_interaction', [Permissions.settings.role.in_system.admin], csv_generator.total_number_of_descriptors_per_interaction);
    app = DendroInteraction2CSV.registerRoute(app, 'GET', 'number_of_descriptors_of_each_type_per_interaction', [Permissions.settings.role.in_system.admin], csv_generator.number_of_descriptors_of_each_type_per_interaction);

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
DendroInteraction2CSV.config = require(path.join(__dirname, "integration", "config.json"));

DendroInteraction2CSV = Class.extend(DendroInteraction2CSV, Plugin, true);

module.exports.DendroInteraction2CSV = DendroInteraction2CSV;