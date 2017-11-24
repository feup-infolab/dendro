const cluster = require("cluster");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const numCPUs = Config.numCPUs;

const startServer = function (app, server, callback)
{
    if (numCPUs && numCPUs > 1)
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
                Logger.log("Express server listening on port " + app.get("port"));
                callback(null);
            });
        }
    }
    else
    {
        server.listen(app.get("port"), function ()
        {
            Logger.log("Express server listening on port " + app.get("port"));
            callback(null);
        });
    }
};

module.exports.startServer = startServer;
