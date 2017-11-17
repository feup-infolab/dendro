const async = require("async");
const morgan = require("morgan");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const initLogging = function (app, callback)
{
    Logger.log("info", "Initializing request times logging...");

    // Setup logging
    if (!isNull(Config.logging))
    {
        async.series([
            function (cb)
            {
                if (Config.logging.log_all_requests)
                {
                    app.use(morgan(function (tokens, req, res)
                    {
                        return [
                            tokens.method(req, res),
                            tokens.url(req, res),
                            tokens.status(req, res),
                            tokens.res(req, res, "content-length"), "-",
                            tokens["response-time"](req, res), "ms"
                        ].join(" ");
                    }));
                }

                if (Config.logging.log_request_times && typeof Config.logging.request_times_log_folder !== "undefined")
                {
                    const absPath = Pathfinder.absPathInApp(Config.logging.app_logs_folder);

                    fs.exists(absPath, function (exists)
                    {
                        if (!exists)
                        {
                            try
                            {
                                mkdirp.sync(absPath);
                                const accessLogStream = require("file-stream-rotator").getStream({
                                    date_format: "YYYYMMDD",
                                    filename: path.join(absPath, "times-%DATE%.log"),
                                    frequency: "daily",
                                    verbose: false
                                });

                                app.use(morgan("combined", {
                                    format: "combined",
                                    stream: accessLogStream
                                }));

                                cb();
                            }
                            catch (e)
                            {
                                Logger.log("error", "[ERROR] Error creating folder for logs at " + absPath + "\n" + JSON.stringify(e));
                                // process.exit(1);
                            }
                        }
                        else
                        {
                            cb(null);
                        }
                    });
                }
                else
                {
                    cb(null);
                }
            }
        ], function (err, results)
        {
            if (err)
            {
                Logger.log("error", "Unable to setup logging!");
            }

            callback(err);
        });
    }
    else
    {
        callback(null);
    }
};

module.exports.initLogging = initLogging;
