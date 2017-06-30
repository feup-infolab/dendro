const Config = function () {
    return global.Config;
}();

const isNull = require(Config.absPathInSrcFolder("/utils/null.js")).isNull;

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