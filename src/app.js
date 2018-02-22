const path = require("path");
const argv = require("yargs").argv;

let appDir;

if (process.env.NODE_ENV === "test")
{
    appDir = path.resolve(path.dirname(require.main.filename), "../../..");
}
else
{
    appDir = path.resolve(path.dirname(require.main.filename), "../");
}

const Pathfinder = require(path.join(appDir, "src", "models", "meta", "pathfinder.js")).Pathfinder;
global.Pathfinder = Pathfinder;
Pathfinder.appDir = appDir;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
let isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
let App = require(Pathfinder.absPathInSrcFolder("/bootup/app.js")).App;
let dendroInstance = new App();

Config.pm2AppName = require(Pathfinder.absPathInApp("package.json")).name + "-" + require(Pathfinder.absPathInApp("package.json")).version;

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
        dendroInstance.killPM2InstancesIfRunning(function (err)
        {
            if (isNull(err))
            {
                const msg = "PM2 instances of " + Config.pm2AppName + " ended successfully.";
                Logger.log(msg);
                process.exit(0);
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
            dendroInstance.startPM2Master();
        }
        else
        {
            Logger.log(`Starting slave process with PID ${process.pid}...`);
            dendroInstance.startApp();
        }
    }
}
else
{
    dendroInstance.killPM2InstancesIfRunning(function (err)
    {
        dendroInstance.startApp();
    });
}
