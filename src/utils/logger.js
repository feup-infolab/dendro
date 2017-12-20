const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const fs = require("fs");
const slug = require("slug");
const mkdirp = require("mkdirp");
const path = require("path");
const winston = require("winston");
const colors = require("colors");

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

Logger.setErrorLogFilePath = function (newErrorLogFilePath)
{
    Logger.errorLogFilePath = newErrorLogFilePath;
};

Logger.getErrorLogFilePath = function ()
{
    return Logger.errorLogFilePath;
};

Logger.init = function (startTime, app)
{
    if (isNull(startTime))
    {
        startTime = new Date();
    }

    const moment = require("moment");
    const fileNameDateSection = moment(startTime).format("YYYY_MM_DD");

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

            let logger;

            const { createLogger, format, transports } = require("winston");
            const { combine, timestamp, label, printf } = format;

            const nonColorizedFormat = printf(function (info)
            {
                return `${info.timestamp} [${process.env.NODE_ENV}] ${info.level}: ${info.message}`;
            });

            const colorizedFormat = printf(function (info)
            {
                const timestamp = info.timestamp.grey;
                let level;
                switch (info.level)
                {
                    case "error":
                    {
                        level = info.level.red.bold;
                        break;
                    }
                    case "warn":
                    {
                        level = info.level.yellow.bold;
                        break;
                    }
                    case "info":
                    {
                        level = info.level.cyan;
                        break;
                    }
                    case "verbose":
                    {
                        level = info.level.grey;
                        break;
                    }
                    case "debug":
                    {
                        level = info.level.orange;
                        break;
                    }
                    case "silly":
                    {
                        level = info.level.purple;
                        break;
                    }
                    default:
                        break;
                }

                return `${timestamp} [${process.env.NODE_ENV}] ${level}: ${info.message}`;
            });

            const env = process.env.NODE_ENV;

            const logFilePath = path.join(absPath, env, fileNameDateSection, `${slug(Config.activeConfiguration)}_${loggerLevel}.log`);
            const errorLogFilePath = path.join(absPath, env, fileNameDateSection, `${slug(Config.activeConfiguration)}_error.log`);

            mkdirp.sync(path.join(absPath, env, fileNameDateSection));

            const fsExtra = require("fs-extra");
            fsExtra.ensureFileSync(logFilePath);
            fsExtra.ensureFileSync(errorLogFilePath);

            Logger.setLogFilePath(logFilePath);
            const logFile = new winston.transports.File(
                {
                    format: combine(
                        timestamp(),
                        nonColorizedFormat
                    ),
                    filename: Logger.getLogFilePath(),
                    level: loggerLevel
                });

            Logger.setErrorLogFilePath(errorLogFilePath);
            const logFileError = new winston.transports.File(
                {
                    format: combine(
                        timestamp(),
                        nonColorizedFormat
                    ),
                    filename: Logger.getErrorLogFilePath(),
                    level: "error"
                });

            const consoleOutput = new winston.transports.Console({
                format: combine(
                    timestamp(),
                    colorizedFormat
                )
            });

            logger = winston.createLogger({
                transports: [
                    consoleOutput,
                    logFileError,
                    logFile
                ]
            });

            logger.on("error", function (err)
            {
                Logger.log("error", JSON.stringify(err));
                process.nextTick(function ()
                {
                    process.kill(process.pid, "SIGTERM");
                });
            });

            logger.emitErrs = true;
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
                const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
                // do not log requests for public assets
                if (
                    Config.logging.do_not_log_requests_to_public_assets &&
                    req.url.startsWith("/bower_components") ||
                    req.url.startsWith("/stylesheets") ||
                    req.url.startsWith("/app") ||
                    req.url.startsWith("/shared") ||
                    req.url.startsWith("/analytics_tracking_code") ||
                    req.url.startsWith("/images") ||
                    req.url.startsWith("/js") ||
                    req.url.startsWith("/admin/logs")
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
        if (Config.runningAsSlave === false)
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
