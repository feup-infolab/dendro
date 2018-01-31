const async = require("async");
const Docker = require("dockerode");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const DockerCheckpointManager = function ()
{
};

DockerCheckpointManager._checkpoints = {};

DockerCheckpointManager.startAllContainers = function (callback)
{
    let hadToStartContainer = false;
    async.mapSeries(Config.docker.containers, function (containerName, callback)
    {
        const docker = new Docker();
        const container = docker.getContainer(containerName);
        container.start(function (err, results)
        {
            // container already started
            if (err.statusCode === 304)
            {
                return callback(null);
            }

            hadToStartContainer = true;
            callback(err, results);
        });
    }, function (err, results)
    {
        if (hadToStartContainer)
        {
            const seconds = 15;
            Logger.log("info", "Had to start docker containers, waiting " + seconds + " for services to boot up...");
            setTimeout(function ()
            {
                callback(err);
            }, seconds * 1000);
        }
        else
        {
            callback(err, results);
        }
    });
};

DockerCheckpointManager.checkpointExists = function (checkpointName)
{
    return (!isNull(DockerCheckpointManager._checkpoints[checkpointName]));
};

DockerCheckpointManager.createCheckpoint = function (checkpointName, callback)
{
    if (!isNull(DockerCheckpointManager._checkpoints[checkpointName]))
    {
        const msg = "There is already a Docker snapshot with name" + checkpointName + "!";
        Logger.log("error", msg);
        callback(1, msg);
    }
    else
    {
        async.mapSeries(Config.docker.containers, function (containerName, callback)
        {
            const docker = new Docker();
            const container = docker.getContainer(containerName);
            container.createCheckpoint({
                checkpointID: containerName
            }, function (err, data)
            {
                if (isNull(err))
                {
                    if (isNull(DockerCheckpointManager._checkpoints.snapshotName))
                    {
                        DockerCheckpointManager._checkpoints.snapshotName = {};
                    }

                    Logger.log("info", "Saved Docker snapshot with name" + checkpointName + " of Docker container " + containerName);
                    DockerCheckpointManager._checkpoints.snapshotName[containerName] = data.id;
                }
                else
                {
                    Logger.log("error", "Error saving Docker snapshot with name" + checkpointName + " of Docker container " + containerName);
                }

                callback(err, data);
            });
        }, function (err, results)
        {
            if (isNull(err))
            {
                Logger.log("info", "Saved all Docker snapshots with name" + checkpointName);
            }
            else
            {
                Logger.log("error", "There was an error creating the snapshots with name " + checkpointName);
            }

            callback(err, results);
        });
    }
};

DockerCheckpointManager.restoreCheckpoint = function (checkpointName, callback)
{
    if (DockerCheckpointManager._checkpoints[checkpointName])
    {
        async.map(Config.docker.containers, function (err, containerName)
        {
            if (DockerCheckpointManager._checkpoints[checkpointName][containerName])
            {
                const docker = new Docker();
                const container = docker.getContainer(containerName);
                container.start({
                    checkpointID: containerName
                });
            }
            else
            {
                callback(err, "Snapshot " + checkpointName + " of container " + containerName + " does not exist!");
            }
        }, function (err, results)
        {
            Logger.log("error", "There was an error restoring the snapshots with name " + checkpointName);
            callback(err, results);
        });
    }
    else
    {
        callback(null, "Unable to find snapshot with id");
    }
};

DockerCheckpointManager.createOrRestoreCheckpoint = function (checkpointName, callback)
{
    if (!DockerCheckpointManager.checkpointExists(checkpointName))
    {
        DockerCheckpointManager.createCheckpoint(checkpointName, function (err, res)
        {
            callback(err, res);
        });
    }
    else
    {
        DockerCheckpointManager.restoreCheckpoint(checkpointName, function (err, res)
        {
            callback(err, res);
        });
    }
};

module.exports.DockerCheckpointManager = DockerCheckpointManager;
