/* eslint-disable quotes,indent */
const path = require("path");
const argv = require("yargs").argv;
const rlequire = require("rlequire");
let isNull = rlequire("dendro", "src/utils/null.js").isNull;

const AppInstance = function ()
{
    let self = this;
    let appDir;

    if (process.env.NODE_ENV === "test")
    {
        appDir = path.resolve(path.dirname(require.main.filename), "../../..");
    }
    else
    {
        appDir = path.resolve(path.dirname(require.main.filename), "../");
    }

    const Config = rlequire("dendro", "src/models/meta/config.js").Config;
    const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
    let isNull = rlequire("dendro", "src/utils/null.js").isNull;
    let App = rlequire("dendro", "src/bootup/app.js").App;

    const options = {
        seed_databases: !isNull(argv.seed_databases)
    };

    self.dendroInstance = new App(options);

    Config.pm2AppName = rlequire("dendro", "package.json").name + "-" + rlequire("dendro", "package.json").version;

    if (isNull(process.env.NODE_ENV) && !isNull(Config.environment))
    {
        process.env.NODE_ENV = Config.environment;
    }

    if (process.env.NODE_ENV === "production")
    {
        // avoid running more instances than the number of cores in the system
        const os = require("os");
        if (os.cpus().length < Config.numCPUs)
        {
            Logger.log_boot_message(`The number of instances specified ( ${Config.numCPUs} ) exceeds the number of cores (physical or virtual) available in this machine (${os.cpus().length} cores)! Reducing the number of instances to ${os.cpus().length}.`);
            Config.numCPUs = os.cpus().length;
        }

        if (!isNull(argv.stop))
        {
            self.dendroInstance.killPM2InstancesIfRunning(function (err)
            {
                if (isNull(err))
                {
                    const msg = "PM2 instances of " + Config.pm2AppName + " ended successfully.";
                    Logger.log(msg);
                    // process.exit(0);
                }
                else
                {
                    const msg = "Unable to kill existing PM2 instances of " + Config.pm2AppName + ": " + JSON.stringify(err);
                    Logger.log("debug", msg);
                }
            });
        }
        else
        {
            // master instance will start the slaves and exit.
            if (!Config.runningAsSlave)
            {
                Logger.log(`Starting master process with PID ${process.pid}...`);
                Logger.log(`Using ${Config.numCPUs} app instances...`);
                self.dendroInstance.startPM2Master();
            }
            else
            {
                Logger.log(`Starting slave process with PID ${process.pid}...`);
                self.dendroInstance.startApp(function (err, result)
                {
                    if (err)
                    {
                        throw err;
                    }
                });
            }
        }
    }
// App has to be manually started by units in Test mode!
// If we are not in a test environment, proceed with the bootup
    else if (process.env.NODE_ENV !== "test")
    {
        self.dendroInstance.killPM2InstancesIfRunning(function (err)
        {
            self.dendroInstance.startApp(function (err)
            {
                if (err)
                {
                    throw err;
                }
                else
                {
                    if (self.dendroInstance.seedDatabasesAndExit)
                    {
                        self.dendroInstance.freeResources(function (err, result)
                        {
                            if (err)
                            {
                                throw err;
                            }
                            else
                            {
                                // process.exit(0);
                            }
                        });
                    }
                }
            });
        });
    }
};

exports.getDendroInstance = function ()
{
    return AppInstance.dendroInstance;
};

exports.setDendroInstance = function (instance)
{
    AppInstance.dendroInstance = instance;
};

if (isNull(AppInstance.dendroInstance))
    {
 AppInstance();
}
