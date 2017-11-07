'use strict';

const path = require('path');

const Pathfinder = function ()
{

};

Pathfinder.absPathInApp = function (relativePath)
{
    return path.join(Pathfinder.appDir, relativePath);
};

Pathfinder.absPathInTestsFolder = function (relativePath)
{
    return path.join(Pathfinder.appDir, 'test', relativePath);
};

Pathfinder.getAbsolutePathToPluginsFolder = function ()
{
    return path.join(Pathfinder.appDir, 'src', 'plugins');
};

Pathfinder.absPathInPluginsFolder = function (relativePath)
{
    return path.join(Pathfinder.getAbsolutePathToPluginsFolder(), relativePath);
};

Pathfinder.absPathInSrcFolder = function (relativePath)
{
    return path.join(Pathfinder.appDir, 'src', relativePath);
};

Pathfinder.getPathToPublicFolder = function ()
{
    return path.join(Pathfinder.appDir, 'public');
};

Pathfinder.absPathInPublicFolder = function (relativePath)
{
    return path.join(Pathfinder.getPathToPublicFolder(), relativePath);
};

module.exports.Pathfinder = Pathfinder;
