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
    fileWatcher();
};

fileWatcher = function () {

    const watcher = chokidar.watch('../temp', {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });

    const log = console.log.bind(console);
    watcher
        .on('add', path => log(`File ${path} has been added`))
        .on('change', path => log(`File ${path} has been changed`))
        .on('unlink', path => log(`File ${path} has been removed`));

};