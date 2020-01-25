const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Permissions = Object.create(rlequire("dendro", "src/models/meta/permissions.js").Permissions);
const DockerManager = Object.create(rlequire("dendro", "src/utils/docker/docker_manager.js").DockerManager);

const notebooks = rlequire("dendro", "src/controllers/notebooks");
const Notebook = rlequire("dendro", "src/models/directory_structure/notebook.js").Notebook;
const querystring = require("querystring");
const proxy = require("http-proxy-middleware");
const wsProxy = require("http-proxy-middleware");

let async = require("async");

const loadRoutes = function (app, callback)
{
    // notebook
    if (Config.notebooks.active)
    {
        const proxyOptions = {
            target: "http://" + Config.notebooks.jupyter.proxy_address,
            logLevel: "debug",
            changeOrigin: true,
            ws: true
        };

        proxyOptions.onProxyReqWs = function (proxyReq, req, socket, options, head)
        {
            const match = req.url.match(/\/notebook_runner\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
            if (!isNull(match) && match instanceof Array)
            {
                const guid = req.url.match(/\/notebook_runner\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)[1];
                const targetNotebook = new Notebook({id: guid});
                const rewrittenHost = targetNotebook.getHost(guid);

                proxyReq.setHeader("Host", rewrittenHost);
                proxyReq.path = req.url;
            }
        };

        proxyOptions.onProxyReq = (proxyReq, req, res) =>
        {
            const guid = req.params[0];
            const targetNotebook = new Notebook({id: guid});
            const rewrittenHost = targetNotebook.getHost(guid);

            proxyReq.setHeader("Host", rewrittenHost);
            proxyReq.path = req.originalUrl;

            if (!req.body || !Object.keys(req.body).length)
            {
                return;
            }

            const contentType = proxyReq.getHeader("Content-Type");
            const writeBody = (bodyData) =>
            {
                proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            };

            if (contentType === "application/json")
            {
                writeBody(JSON.stringify(req.body));
            }

            if (contentType === "application/x-www-form-urlencoded")
            {
                writeBody(querystring.stringify(req.body));
            }
        };

        proxyOptions.onErr = (proxyReq, req, res) =>
        {
            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end("Something went wrong. And we are reporting a custom error message.");
        };

        // TODO fix this activate
        app.all(/\/notebook_runner\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(.*)?/,
            async.apply(Permissions.require, [Permissions.settings.role.in_system.user]),
            async.apply(DockerManager.requireOrchestras, ["dendro_notebook_vhosts"]),

            proxy(
                "",
                proxyOptions
            ));
    }

    callback(null);
};

module.exports.loadRoutes = loadRoutes;
