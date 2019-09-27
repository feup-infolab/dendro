const rlequire = require("rlequire");
const _ = require("underscore");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;

const chokidar = require('chokidar');

module.exports.show = function (req, res)
{
};

module.exports.activate = function (req, res)
{
};

module.exports.new = function (req, res)
{
    const newNotebook = new Notebook();
    newNotebook.spinUp(function (err, result)
    {
        res.redirect(`/notebook_runner/${newNotebook.id}`);
    });

    newNotebook.fileWatcher(newNotebook.id);
};

module.exports.close= function (req,res)
{
};