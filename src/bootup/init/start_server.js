const cluster = require("cluster");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const numCPUs = Config.numCPUs;

const startServer = function (app, server, callback)
{
    if (numCPUs)
    {
        if (cluster.isMaster)
        {
            // Fork workers.
            for (let i = 0; i < numCPUs; i++)
            {
                cluster.fork();
            }
        }
        else
        {
            server.listen(app.get("port"), function ()
            {
                console.log("Express server listening on port " + app.get("port"));
                callback(null);
            });
        }
    }
    else
    {
        server.listen(app.get("port"), function ()
        {
            console.log("Express server listening on port " + app.get("port"));
            callback(null);
        });
    }
};

module.exports.startServer = startServer;
