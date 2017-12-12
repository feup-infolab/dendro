const timeout = require("connect-timeout");

const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const startServer = function (app, server, callback)
{
    app.use(timeout("5s"));

    const haltOnTimedout = function (req, res, next)
    {
        if (!req.timedout)
        {
            next();
        }
    };

    app.use(haltOnTimedout);
    server.listen(app.get("port"), function ()
    {
        Logger.log_boot_message("Dendro server listening on port " + app.get("port"));
        callback(null);
    });
};

module.exports.startServer = startServer;
