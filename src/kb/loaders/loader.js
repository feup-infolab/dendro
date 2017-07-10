const path = require('path');
const Pathfinder = require(path.join(process.cwd(), "src", "models", "meta", "pathfinder.js")).Pathfinder;
const Config = require(path.join(process.cwd(), "src", "models", "meta", "config.js")).Config;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

function Loader ()
{
    const self = this;
}

Loader.prototype.destroyCurrentAndReload = function() {

};

Loader.prototype.clearDownloadedFiles = function() {

};

Loader.prototype.downloadFiles = function() {

};

Loader.prototype.loadFromDownloadedFiles = function() {

};

module.exports.Loader = Loader;