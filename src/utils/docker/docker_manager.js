const fs = require("fs");
const path = require("path");
const _ = require("underscore");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const childProcess = require("child_process");
const startContainersScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/start_containers.sh");
const stopContainersScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/stop_containers.sh");
const createCheckpointScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/create_checkpoint.sh");
const restoreCheckpointScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/restore_checkpoint.sh");
const restartContainersScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/restart_containers.sh");
const nukeAndRebuildScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/nuke_and_rebuild.sh");
const checkIfCheckpointExistsScript = rlequire.absPathInApp("dendro", "conf/scripts/docker/check_if_checkpoint_exists.sh");

const DockerManager = function ()
{
};

const logEverythingFromChildProcess = function (childProcess)
{
    childProcess.stdout.on("data", function (data)
    {
        Logger.log("info", data);
    });

    childProcess.stderr.on("data", function (data)
    {
        Logger.log("warn", data);
    });

    childProcess.on("exit", function (code)
    {
        if (!code)
        {
            Logger.log("info", "Process " + childProcess.cmd + " exited successfully (code 0). ");
        }
        else
        {
            Logger.log("warn", "Process " + childProcess.cmd + " exited with non-zero exit code (code " + code + ".");
        }
    });
};

DockerManager.stopAllContainers = function (callback)
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Stopping all Docker containers.");
        Logger.log("warn", "If it takes long in the first boot PLEASE WAIT! If after 10 minutes without heavy CPU activity please press Ctrl+C and try again.");

        let dockerSubProcess;

        if (process.env.NODE_ENV === "test")
        {
            dockerSubProcess = childProcess.exec(`/bin/bash -c "${stopContainersScript}"`, {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2]
            }, function (err, result)
            {
                Logger.log("Stopped all containers");
                callback(err, result);
            });
        }
        else
        {
            dockerSubProcess = childProcess.exec("docker-compose down", {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2]
            }, function (err, result)
            {
                Logger.log("Started all containers");
                callback(err, result);
            });
        }
        logEverythingFromChildProcess(dockerSubProcess);
    }
    else
    {
        callback(null);
    }
};

DockerManager.startAllContainers = function (callback)
{
    if (Config.docker && Config.docker.active)
    {
        Logger.log("Starting all Docker containers.");
        Logger.log("warn", "If it takes long in the first boot PLEASE WAIT! If after 10 minutes without heavy CPU activity please press Ctrl+C and try again.");

        let dockerSubProcess;
        if (process.env.NODE_ENV === "test")
        {
            dockerSubProcess = childProcess.exec(`/bin/bash -c "${startContainersScript}"`, {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2]
            }, function (err, result)
            {
                Logger.log("Started all containers");
                callback(err, result);
            });
        }
        else
        {
            const mkdirp = require("mkdirp");
            mkdirp.sync(rlequire.absPathInApp("dendro", "volumes"));
            dockerSubProcess = childProcess.exec("docker-compose up -d", {
                cwd: rlequire.getRootFolder("dendro")
            }, function (err, result)
            {
                Logger.log("Started all containers");
                callback(err, result);
            });
        }

        logEverythingFromChildProcess(dockerSubProcess);
    }
    else
    {
        callback(null);
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
                cwd: rlequire.getRootFolder("dendro"),
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
                        cwd: rlequire.getRootFolder("dendro"),
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
                        cwd: rlequire.getRootFolder("dendro"),
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

            if (process.env.NODE_ENV === "test")
            {
                childProcess.execSync(`/bin/bash -c "${nukeAndRebuildScript}"`, {
                    cwd: rlequire.getRootFolder("dendro"),
                    stdio: [0, 1, 2]
                });
            }
            else
            {
                childProcess.execSync(`docker-compose rm -s"`, {
                    cwd: rlequire.getRootFolder("dendro"),
                    stdio: [0, 1, 2]
                });
            }

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
                cwd: rlequire.getRootFolder("dendro"),
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
