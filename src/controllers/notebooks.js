const rlequire = require("rlequire");
const _ = require("underscore");
const async = require("async");
const request = require("request");

const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

module.exports.show = function (req, res)
{
};

module.exports.activate = function (req, res)
{
    console.log("starting activation");
    let resourceURI = req.params.requestedResourceUri;
    Notebook.findByUri(resourceURI, function (err, notebook) {
        if(isNull(err))
        {
            if(isNull(notebook)){
                res.status(500).json(
                    {
                        result: "error",
                        message: "there was an error processing this Notebook request"
                    });
            }
            else
                {
                    notebook.isRunning(function (err, notebookStatus) {
                        if(isNull(err))
                        {
                            if(notebookStatus.active)
                            {
                                if(notebookStatus.folder){
                                    res.send(
                                        {
                                            new_notebook_url: `${Config.baseUri}/notebook_runner/${notebook.ddr.notebookID}`
                                        });
                                }
                                else
                                    {

                                    }
                            }
                            else
                                {
                                   if(notebookStatus.folder){
                                       notebook.spinUp(function (err, result) {
                                           if(isNull(err)){
                                               res.send(
                                                   {
                                                       new_notebook_url: `${Config.baseUri}/notebook_runner/${notebook.ddr.notebookID}`
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
    console.log(resourceURI)

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

        //     const tryToConnect = function (callback)
        //     {
        //         const checkConnectivityOnPort = function (checkObject, callback)
        //         {
        //             const port = checkObject.port;
        //             const textToExpectOnSuccess = checkObject.text;
        //             Logger.log("debug", "Checking connectivity via HTTP on Port " + port + "...");
        //
        //             const request = require("request");
        //
        //             let fullUrl = checkObject.url;
        //
        //             if (port)
        //             {
        //                 fullUrl = fullUrl + ":" + port;
        //             }
        //
        //             request.get({
        //                     url: fullUrl,
        //                     followAllRedirects: true,
        //                     headers: [
        //                         {
        //                             name: "Host",
        //                             value: rewrittenHost
        //                         }
        //                     ]
        //                 },
        //                 function (e, r, data)
        //                 {
        //                     if (isNull(e))
        //                     {
        //                         if (data.indexOf(textToExpectOnSuccess) > -1)
        //                         {
        //                             callback(null);
        //                         }
        //                         else
        //                         {
        //                             callback(1, "Response not matched when checking for connectivity on " + fullUrl);
        //                         }
        //                     }
        //                     else
        //                     {
        //                         if (e.code === "ECONNRESET" && textToExpectOnSuccess === "")
        //                         {
        //                             callback(null);
        //                         }
        //                         else
        //                         {
        //                             callback(1, "Unable to contact Server at " + fullUrl);
        //                         }
        //                     }
        //                 });
        //         };
        //
        //         async.series([
        //                 function (callback)
        //                 {
        //                     checkConnectivityOnPort(
        //                         {
        //                             url: notebookProxyUrl,
        //                             text: "alt=\"Jupyter Notebook\""
        //                         }, callback);
        //                 }
        //             ],
        //             function (err, results)
        //             {
        //                 callback(err, isNull(err));
        //             });
        //     };
        //
        //     async.retry({
        //         times: 240,
        //         interval: function (retryCount)
        //         {
        //             const msecs = 1000;
        //             Logger.log("debug", "Waiting " + msecs / 1000 + " seconds to retry a connection to Jupyter");
        //             return msecs;
        //         }
        //     }, tryToConnect, function (err)
        //     {
        //         if (isNull(error))
        //         {
        //             res.send(
        //                 {
        //                     "new_notebook_url": notebookUrl
        //                 });
        //         }
        //         else {
        //             res.status(500).json({
        //                 result: "Error",
        //                 message: "Unable to start Notebook : " + error
        //             });
        //         }
        //     });
        // });

        newNotebook.save(function (err, result)
        {
            if (!err)
            {
                res.send(
                    {
                        new_notebook_url: notebookUrl
                    });
                newNotebook.fileWatcher();
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
