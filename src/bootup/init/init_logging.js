const async = require("async");
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");

const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const initLogging = function (app, callback)
{
    console.log("[INFO] Initializing logs folder...");
    let registeredUncaughtExceptionHandler = false;

    // Setup logging
    if (!isNull(Config.logging))
    {
        async.series([
            function (cb)
            {
                if (!isNull(Config.logging.app_logs_folder) && (Config.logging.pipe_console_to_logfile || Config.logging.suppress_all_logs || Config.logging.suppress_all_logs))
                {
                    const absPath = Pathfinder.absPathInApp(Config.logging.app_logs_folder);

                    fs.exists(absPath, function (exists)
                    {
                        if (!exists)
                        {
                            try
                            {
                                mkdirp.sync(absPath);
                                console.log("[SUCCESS] Logs folder " + absPath + " created.");
                            }
                            catch (e)
                            {
                                console.error("[FATAL] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(e));
                                process.exit(1);
                            }
                        }

                        const util = require("util");
                        const log_file = require("file-stream-rotator").getStream({
                            date_format: "YYYYMMDD",
                            filename: path.join(absPath, "%DATE%.log"),
                            frequency: "daily",
                            verbose: false
                        });

                        const log_stdout = process.stdout;

                        if (Config.logging.suppress_all_logs)
                        {
                            console.log = function (d)
                            {
                                let a = 1;
                            };
                        }
                        else
                        {
                            console.log = function (d)
                            { //
                                const date = new Date().toISOString();
                                log_file.write("[ " + date + " ] " + util.format(d) + "\n");
                                log_stdout.write(util.format(d) + "\n");

                                if (!isNull(d) && !isNull(d.stack))
                                {
                                    log_file.write("[ " + date + " ] " + util.format(d.stack) + "\n");
                                    log_stdout.write(util.format(d.stack) + "\n");
                                }
                            };
                        }
                        if (Config.logging.suppress_all_errors)
                        {
                            console.error = function (d)
                            {};
                        }
                        else
                        {
                            console.error = function (err)
                            {
                                const date = new Date().toISOString();
                                log_file.write("[ " + new Date().toISOString() + " ] [ERROR] " + util.format(err) + "\n");
                                log_stdout.write(util.format(err) + "\n");

                                if (!isNull(err) && !isNull(err.stack))
                                {
                                    log_file.write("[ " + date + " ] " + util.format(err.stack) + "\n");
                                    log_stdout.write(util.format(err.stack) + "\n");
                                }
                            };
                        }

                        if (!registeredUncaughtExceptionHandler && !(typeof Config.logging.app_logs_folder !== "undefined" && Config.logging.pipe_console_to_logfile))
                        {
                            process.on("uncaughtException", function (err)
                            {
                                const date = new Date().toISOString();

                                if (!isNull(err.stack))
                                {
                                    log_file.write("[ " + date + " ] [ uncaughtException ] " + util.format(err.stack) + "\n");
                                }

                                if (!isNull(app.pid))
                                {
                                    app.pid.remove();
                                }

                                throw err;
                            });

                            registeredUncaughtExceptionHandler = true;
                        }

                        cb(null);
                    });
                }
                else
                {
                    cb(null);
                }
            },
            function (cb)
            {
                if (Config.logging.log_all_requests)
                {
                    const morgan = require("morgan");
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

                                if (!err)
                                {
                                    app.use(morgan(Config.logging.format, {
                                        format: Config.logging.format,
                                        stream: accessLogStream
                                    }));

                                    cb(err);
                                }
                            }
                            catch (e)
                            {
                                console.error("[ERROR] Error creating folder for logs at " + absPath + "\n" + JSON.stringify(e));
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
                console.error("Unable to setup logging!");
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
