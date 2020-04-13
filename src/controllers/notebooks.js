const rlequire = require("rlequire");
const _ = require("underscore");
const async = require("async");
const request = require("request");

const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

module.exports.activate = function (req, res)
{
    console.log("starting activation");
    let resourceURI = req.params.requestedResourceUri;
    Notebook.findByUri(resourceURI, function (err, notebook)
    {
        if (isNull(err))
        {
            if (isNull(notebook))
            {
                res.status(500).json(
                    {
                        result: "error",
                        message: "there was an error processing this Notebook request"
                    });
            }
            else
            {
                notebook.isRunning(function (err, notebookStatus)
                {
                    if (isNull(err))
                    {
                        const notebookUrl = `${Config.baseUri}/notebook_runner/${notebook.ddr.notebookID}`;
                        if (notebookStatus.active)
                        {
                            if (notebookStatus.folder)
                            {
                                res.send(
                                    {
                                        new_notebook_url: notebookUrl
                                    });
                            }
                            else
                            {
                                notebook.stopContainersForNotebooks(notebook, function (err, results)
                                {
                                    if (isNull(err))
                                    {
                                        notebook.dumpNotebooktoTemp(function (err, result)
                                        {
                                            if (isNull(err))
                                            {
                                                res.send(
                                                    {
                                                        new_notebook_url: notebookUrl
                                                    });
                                            }
                                            else
                                            {
                                                res.status(500).json(
                                                    {
                                                        result: "error",
                                                        message: "there was an error restoring the notbook"
                                                    });
                                            }
                                        });
                                    }
                                    else
                                    {
                                        callback(err, results);
                                    }
                                });
                            }
                        }
                        else
                        {
                            if (notebookStatus.folder)
                            {
                                notebook.spinUp(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        res.send(
                                            {
                                                new_notebook_url: notebookUrl
                                            });
                                    }
                                    else
                                    {
                                        res.status(500).json(
                                            {
                                                result: "error",
                                                message: "there was an error spinning up the notbook"
                                            });
                                    }
                                });
                            }
                            else
                            {
                                notebook.dumpNotebooktoTemp(function (err, result)
                                {
                                    if (isNull(err))
                                    {
                                        notebook.spinUp(function (err, result)
                                        {
                                            if (isNull(err))
                                            {
                                                res.send(
                                                    {
                                                        new_notebook_url: notebookUrl
                                                    });
                                            }
                                            else
                                            {
                                                res.status(500).json(
                                                    {
                                                        result: "error",
                                                        message: "there was an error spinning up the notbook"
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }
                });
            }
        }
        else
        {
            res.status(500).json(
                {
                    result: "error",
                    message: "resource with uri : " + requestedResourceUri + " is not a notebook."
                }
            );
        }
    });
    console.log(resourceURI);
};

module.exports.new = function (req, res)
{
    let resourceURI = req.params.requestedResourceUri;
    const newNotebook = new Notebook({
        nie: {
            isLogicalPartOf: resourceURI,
            title: req.query.create_notebook
        }
    });

    newNotebook.spinUp(function (err, result)
    {
        const notebookUrl = `${Config.baseUri}/notebook_runner/${newNotebook.ddr.notebookID}`;
        const notebookProxyUrl = "http://" + Config.notebooks.jupyter.proxy_address;

        const rewrittenHost = newNotebook.getHost();

        newNotebook.save(function (err, result)
        {
            if (!err)
            {
                res.send(
                    {
                        new_notebook_url: notebookUrl
                    });
            }
            else
            {
                res.status(500).send(err);
            }
        });
    });
};

module.exports.close = function (req, res)
{
};
