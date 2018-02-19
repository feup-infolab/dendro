const async = require("async");
const fs = require("fs");
const path = require("path");
const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const isNull = require(Pathfinder.absPathInSrcFolder("/utils/null.js")).isNull;

const childProcess = require("child_process");
const startContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/start_containers.sh");
const stopContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/stop_containers.sh");
const createCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/create_checkpoint.sh");
const restoreCheckpointScript = Pathfinder.absPathInApp("/conf/scripts/docker/restore_checkpoint.sh");
const restartContainersScript = Pathfinder.absPathInApp("/conf/scripts/docker/restart_containers.sh");
const nukeAndRebuildScript = Pathfinder.absPathInApp("/conf/scripts/docker/nuke_and_rebuild.sh");
const dataFolder = Pathfinder.absPathInApp("/data");

const DockerCheckpointManager = function ()
{
};

DockerCheckpointManager._checkpoints = {};

if(Config.docker.reuse_checkpoints)
{
    const checkpointFolders = fs.readdirSync(dataFolder).filter(function (file) {
        return fs.statSync(path.join(dataFolder, file)).isDirectory();
    });

    _.map(checkpointFolders, function(folderName){
        DockerCheckpointManager._checkpoints[folderName] = true;
    });
}

DockerCheckpointManager.stopAllContainers = function ()
{
    if (Config.docker && Config.docker.active)
    {
        const output = childProcess.execSync(`/bin/bash -c "${stopContainersScript}"`, {
            cwd: Pathfinder.appDir
        });

        Logger.log("debug", output);
        return output;
    }
};

DockerCheckpointManager.startAllContainers = function ()
{
    if (Config.docker && Config.docker.active)
    {
        const output = childProcess.execSync(`/bin/bash -c "${startContainersScript}"`, {
            cwd: Pathfinder.appDir
        });

        Logger.log("debug", output);
        return output;
    }
};

DockerCheckpointManager.checkpointExists = function (checkpointName)
{
    if (Config.docker && Config.docker.active)
    {
        return (!isNull(DockerCheckpointManager._checkpoints[checkpointName]));
    }
};

DockerCheckpointManager.createCheckpoint = function (checkpointName)
{
    if (Config.docker && Config.docker.active)
    {
        if (isNull(DockerCheckpointManager._checkpoints[checkpointName]))
        {
            const output = childProcess.execSync(`/bin/bash -c "${createCheckpointScript} ${checkpointName}"`, {
                cwd: Pathfinder.appDir
            });

            Logger.log("debug", output);
            Logger.log("info", "Saved checkpoint with name " + checkpointName);
            DockerCheckpointManager._checkpoints[checkpointName] = true;
        }
    }
};

DockerCheckpointManager.restoreCheckpoint = function (checkpointName)
{
    if (Config.docker && Config.docker.active)
    {
        if (DockerCheckpointManager._checkpoints[checkpointName])
        {
            const output = childProcess.execSync(`/bin/bash -c "${restoreCheckpointScript}" ${checkpointName}`, {
                cwd: Pathfinder.appDir
            });

            Logger.log("debug", output);
            Logger.log("info", "Restored checkpoint with name " + checkpointName + " of Docker container " + checkpointName);
            return true;
        }

        return false;
    }
};

DockerCheckpointManager.createOrRestoreCheckpoint = function (checkpointName)
{
    if (Config.docker && Config.docker.active)
    {
        if (!DockerCheckpointManager.checkpointExists(checkpointName))
        {
            DockerCheckpointManager.createCheckpoint(checkpointName);
            return false;
        }

        DockerCheckpointManager.restoreCheckpoint(checkpointName);
        return true;
    }
};

DockerCheckpointManager.deleteAll = function (onlyOnce, evenCurrentState)
{
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            const del = require("del");
            if (evenCurrentState)
            {
                del.sync([dataFolder + "/*"], {force: true});
            }
            else
            {
                del.sync([dataFolder + "/*", "!" + dataFolder + "/current"], {force: true});
            }
        };

        if (onlyOnce)
        {
            if (!DockerCheckpointManager._deletedOnce)
            {
                performOperation();
                DockerCheckpointManager._deletedOnce = true;
            }
        }
        else
        {
            performOperation();
        }
    }
};

DockerCheckpointManager.nukeAndRebuild = function (onlyOnce)
{
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            const output = childProcess.execSync(`/bin/bash -c "${nukeAndRebuildScript}"`, {
                cwd: Pathfinder.appDir
            });

            Logger.log("debug", output);
            return output;
        };

        if (onlyOnce)
        {
            if (!DockerCheckpointManager._nukedOnce)
            {
                performOperation();
                DockerCheckpointManager._nukedOnce = true;
            }
        }
        else
        {
            performOperation();
        }

        Logger.log("warn", "Nuked and rebuilt all containers.");
    }
};

DockerCheckpointManager.restartAllContainers = function (onlyOnce)
{
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            const output = childProcess.execSync(`/bin/bash -c "${restartContainersScript}"`, {
                cwd: Pathfinder.appDir
            });

            Logger.log("debug", output);
            return output;
        };

        if (onlyOnce)
        {
            if (!DockerCheckpointManager._restartedOnce)
            {
                performOperation();
                DockerCheckpointManager._restartedOnce = true;
            }
        }
        else
        {
            performOperation();
        }
        Logger.log("info", "Restarted all containers.");
    }
};

module.exports.DockerCheckpointManager = DockerCheckpointManager;
