"use strict";

const path = require("path");

const Pathfinder = function ()
{

};

Pathfinder.absPathInApp = function (relativePath)
{
    return path.join(rlequire.getRootFolder("dendro"), relativePath);
};

Pathfinder.absPathInTestsFolder = function (relativePath)
{
    return path.join(rlequire.getRootFolder("dendro"), "test", relativePath);
};

Pathfinder.getAbsolutePathToPluginsFolder = function ()
{
    return path.join(rlequire.getRootFolder("dendro"), "src", "plugins");
};

Pathfinder.absPathInPluginsFolder = function (relativePath)
{
    return path.join(rlequire.absPathInApp("dendro", "src/plugins"), relativePath);
};

Pathfinder.absPathInSrcFolder = function (relativePath)
{
    return path.join(rlequire.getRootFolder("dendro"), "src", relativePath);
};

Pathfinder.getPathToPublicFolder = function ()
{
    return path.join(rlequire.getRootFolder("dendro"), "public");
};

Pathfinder.absPathInPublicFolder = function (relativePath)
{
    return path.join(rlequire.absPathInApp("dendro", "public/"), relativePath);
};

module.exports.Pathfinder = Pathfinder;
