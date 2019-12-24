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
};


module.exports.new = function (req, res)
{
    let resourceURI = req.params.requestedResourceUri;
    const newNotebook = new Notebook(resourceURI);




    newNotebook.spinUp(function (err, result) {

        const notebookUrl = `${Config.baseUri}/notebook_runner/${newNotebook.id}`;
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


        res.send(
            {
                "new_notebook_url": notebookUrl
            });
        });

    newNotebook.fileWatcher(newNotebook.id);
};

module.exports.close= function (req,res)
{
};