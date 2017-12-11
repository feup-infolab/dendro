const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const fs = require("fs");
const slug = require("slug");
const mkdirp = require("mkdirp");
const path = require("path");
const winston = require("winston");

const Logger = function ()
{

};

Logger.setLogFilePath = function (newLogFilePath)
{
    Logger.logFilePath = newLogFilePath;
};

Logger.getLogFilePath = function ()
{
    return Logger.logFilePath;
};

Logger.init = function (startTime, app)
{
    if (isNull(startTime))
    {
        startTime = new Date();
    }
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    // Setup logging
    if (!isNull(Config.logging))
    {
        const loggerLevel = (Config.logging.level) ? Config.logging.level : "debug";
        if (!isNull(Config.logging.app_logs_folder))
        {
            const absPath = Pathfinder.absPathInApp(Config.logging.app_logs_folder);

            const exists = fs.existsSync(absPath);
            if (!exists)
            {
                try
                {
                    mkdirp.sync(absPath);
                }
                catch (e)
                {
                    const msg = "[FATAL] Unable to create folder for logs at " + absPath + "\n" + JSON.stringify(e);
                    throw new Error(msg);
                }
            }

            const logger = winston.createLogger({
                level: loggerLevel
            });

            logger.on("error", function (err)
            {
                Logger.log("error", JSON.stringif(err));
                process.nextTick(function ()
                {
                    process.kill(process.pid, "SIGTERM");
                });
            }
            );

            const { format } = require("winston");
            const { combine, timestamp, printf } = format;
            const consoleFormat = printf(info =>
                `${info.timestamp} ${info.level}: ${info.message}`);

            const jsonFormat = printf(info =>
                JSON.stringify({
                    timestamp: info.timestamp,
                    level: info.level,
                    message: info.message
                }));

            const tsFormat = () => (new Date()).toLocaleTimeString();

            if (process.env.NODE_ENV === "development")
            {
                mkdirp.sync(path.join(absPath, "development"));
                // const errorLogFile = new winston.transports.File({
                //     timestamp: tsFormat,
                //     filename: path.join(absPath, "development", `${slug(startTime.toISOString() + "_" + Config.activeConfiguration, "_")}-error.log`),
                //     level: "error",
                //     handleExceptions: true,
                //     format: combine(
                //         timestamp(),
                //         jsonFormat
                //     )
                // });

                Logger.setLogFilePath(path.join(absPath, "development", `${slug(startTime.toISOString() + "_" + Config.activeConfiguration, "_")}-${loggerLevel}.log`));

                const logFile = new winston.transports.File({
                    timestamp: tsFormat,
                    filename: Logger.getLogFilePath(),
                    level: loggerLevel,
                    handleExceptions: true,
                    exitOnError: true,
                    format: combine(
                        timestamp(),
                        jsonFormat
                    )
                });

                // logger.add(errorLogFile);
                logger.add(logFile);

                // colorize the output to the console
                const coloredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
                        handleExceptions: true,
                        colorize: true,
                        format: combine(
                            timestamp(),
                            consoleFormat
                        )
                    });

                logger.add(coloredConsoleOutput);
            }
            else if (process.env.NODE_ENV === "test")
            {
                mkdirp.sync(path.join(absPath, "test"));
                // const errorLogFile = new winston.transports.File({
                //     timestamp: tsFormat,
                //     filename: path.join(absPath, "test", `${slug(startTime.toISOString() + "_" + Config.activeConfiguration, "_")}-error.log`),
                //     handleExceptions: true,
                //     level: "error",
                //     format: combine(
                //         timestamp(),
                //         jsonFormat
                //     )
                // });

                Logger.setLogFilePath(path.join(absPath, "test", `${slug(startTime.toISOString() + "_" + Config.activeConfiguration, "_")}-${loggerLevel}.log`));
                const logFile = new winston.transports.File({
                    timestamp: tsFormat,
                    filename: Logger.getLogFilePath(),
                    level: loggerLevel,
                    handleExceptions: true,
                    exitOnError: true,
                    format: combine(
                        timestamp(),
                        jsonFormat
                    )
                });

                // logger.add(errorLogFile);
                logger.add(logFile);

                // colorize the output to the console
                const coloredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
                        colorize: true,
                        handleExceptions: true,
                        format: combine(
                            timestamp(),
                            consoleFormat
                        )
                    });

                logger.add(coloredConsoleOutput);
            }
            else if (process.env.NODE_ENV === "production")
            {
                mkdirp.sync(path.join(absPath, "production"));
                const rotator = require("stream-rotate");

                const logStream = rotator({
                    path: path.join(absPath, "production"),
                    name: slug("production_" + Config.activeConfiguration + "_" + loggerLevel, "_"),
                    size: "5m",
                    retention: 2,
                    boundary: "daily"
                });

                const logFile = new winston.transports.File(
                    {
                        timestamp: tsFormat,
                        stream: logStream,
                        level: loggerLevel,
                        handleExceptions: true,
                        exitOnError: true,
                        format: combine(
                            timestamp(),
                            jsonFormat
                        )
                    });

                // const logstreamError = rotator({
                //     path: path.join(absPath, "production"),
                //     name: slug("production_" + Config.activeConfiguration + "_error", "_"),
                //     size: "5m",
                //     retention: 2,
                //     boundary: "daily"
                // });
                //
                // const logFileError = new winston.transports.File(
                //     {
                //         timestamp: tsFormat,
                //         stream: logstreamError,
                //         level: loggerLevel,
                //         handleExceptions: true,
                //         format: combine(
                //             timestamp(),
                //             jsonFormat
                //         )
                //     });

                logger.add(logFile);
                // logger.add(logFileError);

                // do not colorize the output to the console
                const nonColoredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
                        handleExceptions: true,
                        format: combine(
                            timestamp(),
                            consoleFormat
                        )
                    });

                logger.add(nonColoredConsoleOutput);
            }

            Logger.logger = logger;
        }
        else
        {
            throw new Error("Logs folder location not setup!");
        }
    }
    else
    {
        throw new Error("Logger configuration not setup!");
    }
};

Logger.add_middlewares = function (app)
{
    const expressWinston = require("express-winston");
    app.use(
        expressWinston.logger({
            winstonInstance: Logger.logger,
            // optional: control whether you want to log the meta data about the request (default to true)
            meta: true,
            // msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
            // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
            expressFormat: true,
            // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
            colorize: true,
            // optional: allows to skip some log messages based on request and/or response
            ignoreRoute: function (req, res)
            {
                // do not log requests for public assets
                if (req.url.startsWith("/bower_components") ||
                    req.url.startsWith("/stylesheets") ||
                    req.url.startsWith("/app") ||
                    req.url.startsWith("/shared") ||
                    req.url.startsWith("/analytics_tracking_code") ||
                    req.url.startsWith("/images") ||
                    req.url.startsWith("/js")
                )
                {
                    return true;
                }

                return false;
            }
        })
    );
};

Logger.log_boot_message = function (message)
{
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    if (Config.startup.log_bootup_actions)
    {
        if (Config.numCPUs > 1)
        {
            if (!Config.runningAsSlave)
            {
                if (!isNull(Logger.logger))
                {
                    Logger.logger.info(message);
                }
                else
                {
                    console.log(message);
                }
            }
        }
        else
        {
            if (!isNull(Logger.logger))
            {
                Logger.logger.info(message);
            }
            else
            {
                console.log(message);
            }
        }
    }
};

Logger.log = function (type, message)
{
    // special case for when the message is null and we are logging an error
    if (type === "error")
    {
        const stack = new Error().stack;
        let msg;

        if (isNull(message))
        {
            msg = "Unspecified error at : " + stack;
        }
        else
        {
            msg = "Error " + message + " at : " + stack;
        }

        if (!isNull(Logger.logger))
        {
            Logger.logger.error(msg);
        }
        else
        {
            console.error(msg);
        }

        return;
    }

    if (typeof type === "string" && !isNull(message))
    {
        if (!isNull(Logger.logger))
        {
            if (!isNull(Logger.logger.levels[type]))
            {
                Logger.logger[type](message);
            }
            else
            {
                throw new Error(type + " is not a valid log type! Valid log types are : " + JSON.stringify(Logger.logger.levels));
            }
        }
        else
        {
            if (type === "error")
            {
                console.error(message);
            }
            else
            {
                console.log(message);
            }
        }
    }
    else if (!isNull(type) && typeof type === "string" && isNull(message))
    {
        message = type;
        if (!isNull(Logger.logger))
        {
            Logger.logger.info(message);
        }
        else
        {
            console.log(message);
        }
    }
};

module.exports.Logger = Logger;
