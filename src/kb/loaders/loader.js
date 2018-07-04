const path = require("path");
const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;

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
