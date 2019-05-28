const rlequire = require("rlequire");
const async = require("async");
const _ = require("underscore");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const slug = rlequire("dendro", "src/utils/slugifier.js");
//
// Create a proxy server with custom application logic
//
const httpProxy = require("http-proxy");
const proxy = httpProxy.createProxyServer({});

module.exports.show = function (req, res)
{
};

module.exports.activate = function (req, res)
{

};

module.exports.pipe_to_instance = function (req, res)
{
    // Restream parsed body before proxying
    proxy.on("proxyReq", function (proxyReq, req, res, options)
    {
        if (req.body)
        {
            let bodyData = JSON.stringify(req.body);
            // In case if content-type is application/x-www-form-urlencoded -> we need to change to application/json
            // proxyReq.setHeader('Content-Type','application/json');
            // proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // Stream the content
            // proxyReq.write(bodyData);

            proxyReq.setHeader("Host", `jupyter-notebook.${req.params.guid}`);
            proxyReq.path = proxyReq.path.substr(req.url.length);
            if (proxyReq.path.length === 0)
            {
                proxyReq.path = "/";
            }
        }
    });

    proxy.web(req, res, {
        target: "http://127.0.0.1:9000"
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

