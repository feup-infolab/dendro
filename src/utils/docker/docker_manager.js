const fs = require("fs");
const path = require("path");
const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

const childProcess = require("child_process");
const startContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/start_containers.sh");
const stopContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/stop_containers.sh");
const createCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/create_checkpoint.sh");
const restoreCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/restore_checkpoint.sh");
const restartContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/restart_containers.sh");
const nukeAndRebuildScript = Pathfinder.absPathInApp("/conf/scripts/docker/nuke_and_rebuild.sh");
const checkIfCheckpointExistsScript = Pathfinder.absPathInApp("/conf/scripts/docker/check_if_checkpoint_exists.sh");
const dataFolder = Pathfinder.absPathInApp("/data");

const DockerManager = function ()
{
};

DockerManager.stopAllContainers = function ()
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Stopping all Docker containers.");
        childProcess.execSync(`/bin/bash -c "${stopContainersScript}"`, {
            cwd: Pathfinder.appDir,
            stdio: [0, 1, 2]
        });

        Logger.log("Stopped all containers");
    }
};

DockerManager.startAllContainers = function ()
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Starting all Docker containers.");
        childProcess.execSync(`/bin/bash -c "${startContainersScript}"`, {
            cwd: Pathfinder.appDir,
            stdio: [0, 1, 2]
        });

        Logger.log("Started all containers");
    }
};

DockerManager.checkpointExists = function (checkpointName, callback)
{
    if (isNull(checkpointName))
    {
        callback(null, false);
    }
    else
    {
        if (Config.docker && Config.docker.active)
        {
            childProcess.exec(`/bin/bash -c "${checkIfCheckpointExistsScript} ${checkpointName}"`, {
                cwd: Pathfinder.appDir,
                stdio: [0, 1, 2]
            }, function (err, result)
            {
                if (isNull(err))
                {
                    callback(null, true);
                }
                else
                {
                    callback(null, false);
                }
            });
        }
        else
        {
            callback(null, false);
        }
    }
};

DockerManager.createCheckpoint = function (checkpointName, callback)
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Creating Docker checkpoint " + checkpointName);
        DockerManager.checkpointExists(checkpointName, function (err, exists)
        {
            if (isNull(err))
            {
                if (!exists)
                {
                    childProcess.exec(`/bin/bash -c "${createCheckpointScript} ${checkpointName}"`, {
                        cwd: Pathfinder.appDir,
                        stdio: [0, 1, 2]
                    }, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Saved checkpoint with name " + checkpointName);
                        }
                        callback(err, result);
                    });
                }
                else
                {
                    Logger.log("Checkpoint " + checkpointName + " already exists.");
                    callback(null);
                }
            }
            else
            {
                callback(err, exists);
            }
        });
    }
    else
    {
        callback(null);
    }
};

DockerManager.restoreCheckpoint = function (checkpointName, callback)
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Restoring Docker checkpoint " + checkpointName);
        DockerManager.checkpointExists(checkpointName, function (err, exists)
        {
            if (!err)
            {
                if (exists)
                {
                    childProcess.exec(`/bin/bash -c "${restoreCheckpointScript} ${checkpointName}"`, {
                        cwd: Pathfinder.appDir,
                        stdio: [0, 1, 2]
                    }, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Restored Docker checkpoint with name " + checkpointName + " of Docker containers.");
                            callback(err, true);
                        }
                        else
                        {
                            callback(err, false);
                        }
                    });
                }
                else
                {
                    const msg = "Checkpoint " + checkpointName + " does not exist!";
                    Logger.log("error", msg);
                    callback(null, false);
                }
            }
            else
            {
                callback(err, false);
            }
        });
    }
    else
    {
        callback(null, false);
    }
};

DockerManager.nukeAndRebuild = function (onlyOnce)
{
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            Logger.log("Rebuilding all Docker containers.");
            childProcess.execSync(`/bin/bash -c "${nukeAndRebuildScript}"`, {
                cwd: Pathfinder.appDir,
                stdio: [0, 1, 2]
            });

            Logger.log("Nuked and rebuilt all containers.");
        };

        if (onlyOnce)
        {
            if (!DockerManager._nukedOnce)
            {
                performOperation();
                DockerManager._nukedOnce = true;
            }
        }
        else
        {
            performOperation();
        }
    }
};

DockerManager.restartContainers = function (onlyOnce)
{
    Logger.log("Restarting all Docker containers.");
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            childProcess.execSync(`/bin/bash -c "${restartContainersScript}"`, {
                cwd: Pathfinder.appDir,
                stdio: [0, 1, 2]
            });

            Logger.log("Restarted all containers");
        };

        if (onlyOnce)
        {
            if (!DockerManager._restartedOnce)
            {
                performOperation();
                DockerManager._restartedOnce = true;
            }
        }
        else
        {
            performOperation();
        }
        Logger.log("Restarted all containers.");
    }
};

module.exports.DockerManager = DockerManager;
