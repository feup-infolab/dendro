const path = require("path");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

function Loader ()
{
    const self = this;
}

Loader.prototype.destroyCurrentAndReload = function ()
{

};

Loader.prototype.clearDownloadedFiles = function ()
{

};

Loader.prototype.downloadFiles = function ()
{

};

Loader.prototype.loadFromDownloadedFiles = function ()
{

};

module.exports.Loader = Loader;
