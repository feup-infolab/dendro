const rlequire = require("rlequire");
const async = require("async");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const _ = require("underscore");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const bodyParser = require("body-parser");
const streamify = require("stream-array");
//
// Create a proxy server with custom application logic
//
const httpProxy = require("http-proxy");
const proxy = httpProxy.createProxyServer({});
const jupyterProxyUrl = "http://127.0.0.1:15017";

module.exports.show = function (req, res)
{
};

module.exports.activate = function (req, res)
{

};

module.exports.pipe_to_instance = function (req, res, next)
{
    async.series([
        function (callback)
        {
            async.series([
                function (callback)
                {
                    const bufferRequest = function (req, res)
                    {
                        let data = "";
                        req.setEncoding("utf8");
                        req.on("data", function (chunk)
                        {
                            data += chunk;
                        });
                        req.on("end", function ()
                        {
                            req.rawBody = data;
                            callback();
                        });
                    };

                    if(req.method === "POST" || req.method === "PUT")
                    {
                        bufferRequest(req, res);
                    }
                    else
                    {
                        callback();
                    }
                }
            ], callback);
        },
        function (callback)
        {
            // Restream parsed body before proxying
            proxy.on("proxyReq", function (proxyReq, req, res, options)
            {
                const guid = req.params[0];
                const targetNotebook = new Notebook({id: guid});
                const rewrittenHost = targetNotebook.getHost(guid);

                proxyReq.setHeader("Host", rewrittenHost);
                proxyReq.forward = req.originalUrl;
            });

            proxy.on("close", function (proxyReq, req, res, options)
            {
                callback();
            });

            const options = {
                target: `${jupyterProxyUrl}`,
                followRedirects: true
            };

            if (req.rawBody)
            {
                options.buffer = streamify(Array.from(req.rawBody));
            }

            proxy.web(req, res, options);
        }
    ], function (err, results)
    {
        next();
    });
};

module.exports.new = function (req, res)
{
    const newNotebook = new Notebook();
    newNotebook.spinUp(function (err, result)
    {
        res.redirect(`/notebook_runner/${newNotebook.id}`);
    });
};

