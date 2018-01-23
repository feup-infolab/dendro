const timeout = require("connect-timeout");

const Pathfinder = global.Pathfinder;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const startServer = function (app, server, callback)
{
    // 5 min timeout
    const minutesTimeout = 5;
    const timeoutMillisecs = minutesTimeout * 60 * 1000;

    app.use(timeout(minutesTimeout + "s"));

    const haltOnTimedout = function (req, res, next)
    {
        if (!req.timedout)
        {
            next();
        }
    };

    app.use(haltOnTimedout);
    server.setTimeout(timeoutMillisecs);

    server.listen(app.get("port"), function ()
    {
        var ip = require("ip");
        Logger.log_boot_message("Dendro server listening on " + ip.address() + ":" + app.get("port"));
        callback(null);
    });
};

module.exports.startServer = startServer;
