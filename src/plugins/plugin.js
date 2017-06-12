var path = require('path');
var async = require('async');

const Config = function () {
    return GLOBAL.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;
var Permissions = require(Config.absPathInSrcFolder("models/meta/permissions.js")).Permissions;

function Plugin (object)
{
    var self = this;
    Plugin.baseConstructor.call(this, object);
    return self;
}

Plugin.registerStaticFilesRoute = function(app)
{
    var self = this;
    var pluginBaseFolderName = self.config.plugin_folder_name;
    var fullRoute = '/plugins/' + pluginBaseFolderName +  "/public";
    var absPathToPluginPublicFolder = path.join(self.getPluginRootFolder(), "package", "public");

    var express = require('express');

    app.use(fullRoute, express.static(absPathToPluginPublicFolder));

    return app;
};

Plugin.registerRoute = function(app, method, route, permissions, controllerMethod)
{
    var self = this;
    var pluginBaseFolderName = self.config.plugin_folder_name;


    if(route instanceof RegExp)
    {
        fullRoute = '\\/plugins\\/' + pluginBaseFolderName + "\\" + route.toString();
        if(fullRoute[fullRoute.length - 1] == "/")
        {
            fullRoute = fullRoute.substring(0, fullRoute.length - 1);
        }
        fullRoute = new RegExp(fullRoute);
    }
    else if(route == "/")
    {
        var fullRoute = '/plugins/' + pluginBaseFolderName;
    }
    else
    {
        var fullRoute = '/plugins/' + pluginBaseFolderName + "/" + route;
    }

    if(method.toLowerCase() == 'get')
    {
        app = app.get(fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if(method.toLowerCase() == 'post')
    {
        app = app.post(fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if(method.toLowerCase() == 'put')
    {
        app = app.put(fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if(method.toLowerCase() == 'delete')
    {
        app = app.delete(fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }

    return app;
};


Plugin.getPluginRootFolder = function()
{
    var self = this;
    var allPluginsRootFolder = Config.getAbsolutePathToPluginsFolder();
    var myConfig = self.config;
    var pluginRootFolder = path.join(allPluginsRootFolder, myConfig.plugin_folder_name);

    return pluginRootFolder;
};

Plugin.renderView = function(res, viewPath, dataObject)
{
    var self = this;
    var ejs = require('ejs');

    /**
     * Add the ".ejs" suffix if it is not present
     */
    if(!viewPath.indexOf(".ejs", this.length - ".ejs".length) !== -1)
    {
        viewPath = viewPath + ".ejs";
    }

    var pluginViewAbsPath = path.join(Config.getAbsolutePathToPluginsFolder(), self.config.plugin_folder_name, "package", "views", viewPath);

    /**
     * Copy global data objects so that they are accessible in the plugins' views
     * (THIS IS UGLY and non-expansible)
     * TODO FIX LATER?
     */
    dataObject.locals = res.locals;
    dataObject.settings = res.app.settings;


        ejs.renderFile(
            pluginViewAbsPath,
            dataObject,
            function(error, html)
            {
                if(!error)
                {
                    res.send(html);
                }
                else
                {
                    res.status(500).send("Error in plugin " + self.config.name + error);
                }
            }
        )
};

module.exports.Plugin = Plugin;