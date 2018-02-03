const async = require("async");
const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const childProcess = require("child_process");
const startContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/start_containers.sh");
const createCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/create_checkpoint.sh");
const restoreCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/restore_checkpoint.sh");

const DockerCheckpointManager = function ()
{
};

DockerCheckpointManager._checkpoints = {};

DockerCheckpointManager.startAllContainers = function ()
{
    return childProcess.execSync(`/bin/bash -c "${startContainersScript}"`, {
        cwd: Pathfinder.appDir,
        stdio: [0, 1, 2]
    });
};

DockerCheckpointManager.checkpointExists = function (checkpointName)
{
    return (!isNull(DockerCheckpointManager._checkpoints[checkpointName]));
};

DockerCheckpointManager.createCheckpoint = function (checkpointName)
{
    if (!isNull(DockerCheckpointManager._checkpoints[checkpointName]))
    {
        const msg = "There is already a Docker snapshot with name" + checkpointName + "!";
        throw new Error(msg);
    }
    else
    {
        childProcess.execSync(`/bin/bash -c "${createCheckpointScript} ${checkpointName}"`, {
            cwd: Pathfinder.appDir,
            stdio: [0, 1, 2]
        });

        Logger.log("info", "Saved snapshot with name" + checkpointName);
        DockerCheckpointManager._checkpoints[checkpointName] = true;
    }
};

DockerCheckpointManager.restoreCheckpoint = function (checkpointName)
{
    if (DockerCheckpointManager._checkpoints[checkpointName])
    {
        childProcess.execSync(`/bin/bash -c "${restoreCheckpointScript}" ${checkpointName}`, {
            cwd: Pathfinder.appDir,
            stdio: [0, 1, 2]
        });

        Logger.log("info", "Restored snapshot with name" + checkpointName + " of Docker container " + checkpointName);
    }
    else
    {
        throw new Error("Unable to find snapshot with name " + checkpointName);
    }
};

DockerCheckpointManager.createOrRestoreCheckpoint = function (checkpointName)
{
    if (!DockerCheckpointManager.checkpointExists(checkpointName))
    {
        return DockerCheckpointManager.createCheckpoint(checkpointName);
    }

    return DockerCheckpointManager.restoreCheckpoint(checkpointName);
};

module.exports.DockerCheckpointManager = DockerCheckpointManager;
