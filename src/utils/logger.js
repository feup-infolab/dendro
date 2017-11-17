const Pathfinder = global.Pathfinder;
const isNull = require(Pathfinder.absPathInSrcFolder("utils/null.js")).isNull;

const fs = require("fs");
const slug = require("slug");
const mkdirp = require("mkdirp");
const winston = require("winston");

const Logger = function ()
{

};

Logger.init = function (startTime)
{
    const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
    // Setup logging
    if (!isNull(Config.logging))
    {
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
                level: Config.logging.level
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
                    const errorLogFile = new winston.transports.File({
                        filename: `${absPath}/${slug(new Date().toISOString(), "_")}-error.log`,
                        level: "error",
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
                    let errorLogFile;
                    if (!isNull(startTime))
                    {
                        errorLogFile = new winston.transports.File({
                            filename: `${absPath}/${slug(startTime.toISOString(), "_")}-error.log`,
                            level: "error",
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });
                    }
                    else
                    {
                        errorLogFile = new winston.transports.File({
                            filename: `${absPath}/${slug(new Date().toISOString(), "_")}-error.log`,
                            level: "error",
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });
                    }

                    let combinedErrorLog;
                    if (!isNull(startTime))
                    {
                        combinedErrorLog = new winston.transports.File({
                            filename: `${absPath}/${slug(startTime.toISOString(), "_")}-combined.log`,
                            level: "info",
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });
                    }
                    else
                    {
                        combinedErrorLog = new winston.transports.File({
                            filename: `${absPath}/${slug(new Date().toISOString(), "_")}-combined.log`,
                            level: "info",
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });
                    }

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
                    const rotator = require("stream-rotate");
                    const logstream = rotator({
                        path: absPath,
                        name: "dendro",
                        size: "5m",
                        retention: 2,
                        boundary: "daily"
                    });

                    const rotatedLogFile = new winston.transports.File(
                        {
                            stream: logstream,
                            timestamp: tsFormat,
                            format: combine(
                                timestamp(),
                                jsonFormat
                            )
                        });

                    logger.add(rotatedLogFile);
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
    if (typeof type === "string" && !isNull(message))
    {
        if (!isNull(Logger.logger))
        {
            Logger.logger[type](message);
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
