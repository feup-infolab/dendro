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

Logger.init = function (startTime)
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
                if (Config.logging.pipe_console_to_logfile)
                {
                    mkdirp.sync(path.join(absPath, "development"));
                    const errorLogFile = new winston.transports.File({
                        filename: `${absPath}/development/${slug(startTime.toISOString() + "_development_" + Config.activeConfiguration, "_")}-error.log`,
                        level: loggerLevel,
                        format: combine(
                            timestamp(),
                            jsonFormat
                        )
                    });
                    const combinedErrorLog = new winston.transports.File({filename: "combined.log"});

                    logger.add(errorLogFile);
                    logger.add(combinedErrorLog);
                }

                // colorize the output to the console
                const coloredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
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
                if (Config.logging.pipe_console_to_logfile)
                {
                    mkdirp.sync(path.join(absPath, "test"));
                    const errorLogFile = new winston.transports.File({
                        filename: `${absPath}/test/${slug(startTime.toISOString() + "_test_" + Config.activeConfiguration, "_")}-error.log`,
                        level: loggerLevel,
                        format: combine(
                            timestamp(),
                            jsonFormat
                        )
                    });

                    const combinedErrorLog = new winston.transports.File({
                        filename: `${absPath}/test/${slug(startTime.toISOString() + "_test_" + Config.activeConfiguration, "_")}-combined.log`,
                        level: loggerLevel,
                        format: combine(
                            timestamp(),
                            jsonFormat
                        )
                    });

                    logger.add(errorLogFile);
                    logger.add(combinedErrorLog);
                }

                // colorize the output to the console
                const coloredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
                        colorize: true,
                        format: combine(
                            timestamp(),
                            consoleFormat
                        )
                    });

                logger.add(coloredConsoleOutput);
            }
            else if (process.env.NODE_ENV === "production")
            {
                if (Config.logging.pipe_console_to_logfile)
                {
                    mkdirp.sync(path.join(absPath, "production"));
                    const rotator = require("stream-rotate");
                    const logstreamInfo = rotator({
                        path: path.join(absPath, "production"),
                        name: slug(startTime.toISOString() + "_production_" + Config.activeConfiguration + "_combined", "_"),
                        size: "5m",
                        retention: 2,
                        boundary: "daily"
                    });

                    const rotatedLogFileInfo = new winston.transports.File(
                        {
                            stream: logstreamInfo,
                            level: loggerLevel,
                            timestamp: tsFormat,
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });

                    const logstreamError = rotator({
                        path: path.join(absPath, "production"),
                        name: slug(startTime.toISOString() + "_production_" + Config.activeConfiguration + "_error", "_"),
                        size: "5m",
                        retention: 2,
                        boundary: "daily"
                    });

                    const rotatedLogFileError = new winston.transports.File(
                        {
                            stream: logstreamError,
                            level: loggerLevel,
                            timestamp: tsFormat,
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });

                    logger.add(rotatedLogFileInfo);
                    logger.add(rotatedLogFileError);
                }

                // do not colorize the output to the console
                const nonColoredConsoleOutput = new (winston.transports.Console)(
                    {
                        timestamp: tsFormat,
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

Logger.log_boot_message = function (message)
{
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    if (Config.startup.log_bootup_actions)
    {
        Logger.logger.info(message);
    }
};

Logger.log = function (type, message)
{
    // special case for when the message is null and we are logging an error
    if (type === "error" && isNull(message))
    {
        const stack = new Error().stack;
        const msg = "Unspecified error at : " + stack;
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
