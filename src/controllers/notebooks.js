const rlequire = require("rlequire");
const async = require("async");
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const _ = require("underscore");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const bodyParser = require("body-parser");
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
                    bodyParser.urlencoded({limit: "5mb", extended: true})(req, res, callback);
                },
                function (callback)
                {
                    bodyParser.json({limit: "5mb"})(req, res, callback);
                }
            ], callback);
        },
        function (callback)
        {
            // Restream parsed body before proxying
            proxy.on("proxyReq", function (proxyReq, req, res, options)
            {
                const guid = req.params[0];
                // const targetUrl = req.originalUrl;

                const targetNotebook = new Notebook({id: guid});

                const rewrittenHost = targetNotebook.getHost(guid);
                // const rewrittenUrl = targetNotebook.rewriteUrl(targetUrl);

                proxyReq.setHeader("Host", rewrittenHost);
                proxyReq.forward = req.originalUrl;

                if (req.method === "POST")
                {
                    if (req.body)
                    {
                        let bodyData = JSON.stringify(req.body);
                        // In case if content-type is application/x-www-form-urlencoded -> w    e need to change to application/json
                        // proxyReq.setHeader("Content-Type", "application/json");
                        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
                        // Stream the content
                        proxyReq.write(bodyData);
                        callback();
                    }
                }
            });

            proxy.web(req, res, {
                target: `${jupyterProxyUrl}`
            });
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

