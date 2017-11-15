const path = require("path");
const Pathfinder = global.Pathfinder;
const async = require("async");

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Permissions = require(Pathfinder.absPathInSrcFolder("models/meta/permissions.js")).Permissions;

function Plugin (object)
{
    const self = this;
    Plugin.baseConstructor.call(this, object);
    return self;
}

Plugin.registerStaticFilesRoute = function (app)
{
    const self = this;
    self.pluginBaseFolderName = self.config.plugin_folder_name;
    self.fullRoute = "/plugins/" + self.pluginBaseFolderName + "/public";
    const absPathToPluginPublicFolder = path.join(self.getPluginRootFolder(), "package", "public");

    const express = require("express");

    app.use(self.fullRoute, express.static(absPathToPluginPublicFolder));

    return app;
};

Plugin.registerRoute = function (app, method, route, permissions, controllerMethod)
{
    const self = this;
    const pluginBaseFolderName = self.config.plugin_folder_name;
    let fullRoute;

    if (route instanceof RegExp)
    {
        fullRoute = "\\/plugins\\/" + pluginBaseFolderName + "\\" + route.toString();
        if (fullRoute[fullRoute.length - 1] === "/")
        {
            fullRoute = fullRoute.substring(0, fullRoute.length - 1);
        }
        self.fullRoute = new RegExp(fullRoute);
    }
    else if (route === "/")
    {
        self.fullRoute = "/plugins/" + pluginBaseFolderName;
    }
    else
    {
        self.fullRoute = "/plugins/" + pluginBaseFolderName + "/" + route;
    }

    if (method.toLowerCase() === "get")
    {
        app = app.get(self.fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if (method.toLowerCase() === "post")
    {
        app = app.post(self.fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if (method.toLowerCase() === "put")
    {
        app = app.put(self.fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }
    else if (method.toLowerCase() === "delete")
    {
        app = app.delete(self.fullRoute, async.apply(Permissions.require, permissions), controllerMethod);
    }

    return app;
};

Plugin.getPluginRootFolder = function ()
{
    const self = this;
    const allPluginsRootFolder = Pathfinder.getAbsolutePathToPluginsFolder();
    const myConfig = self.config;

    return path.join(allPluginsRootFolder, myConfig.plugin_folder_name);
};

Plugin.renderView = function (res, viewPath, dataObject)
{
    const self = this;
    const ejs = require("ejs");

    /**
     * Add the ".ejs" suffix if it is not present
     */
    if (!viewPath.indexOf(".ejs", this.length - ".ejs".length) !== -1)
    {
        viewPath = viewPath + ".ejs";
    }

    const pluginViewAbsPath = path.join(Pathfinder.getAbsolutePathToPluginsFolder(), self.config.plugin_folder_name, "package", "views", viewPath);

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
        function (error, html)
        {
            if (isNull(error))
            {
                res.send(html);
            }
            else
            {
                res.status(500).send("Error in plugin " + self.config.name + error);
            }
        }
    );
};

module.exports.Plugin = Plugin;
