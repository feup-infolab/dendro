const rlequire = require("rlequire");
const async = require("async");
const _ = require("underscore");
const Notebook = rlequire("dendro","src/models/directory_structure/notebook.js").Notebook;

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
        res.json({
            result: "Spin up complete"
        });
    });
};
