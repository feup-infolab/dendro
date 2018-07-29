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

DockerManager.getEnvVars = function ()
{
    const defaultEnvs = JSON.parse(JSON.stringify(process.env));
    const varKeys = Object.keys(Config.docker.environment_variables);
    for (let i = 0; i < varKeys.length; i++)
    {
        let varKey = varKeys[i];
        defaultEnvs[varKey] = Config.docker.environment_variables[varKey];
    }

    return defaultEnvs;
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
                stdio: [0, 1, 2],
                env: DockerManager.getEnvVars()
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
                stdio: [0, 1, 2],
                env: Config.docker.environment_variables
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
        dockerSubProcess = childProcess.exec("docker-compose up -d", {
            cwd: rlequire.getRootFolder("dendro"),
            stdio: [0, 1, 2],
            env: DockerManager.getEnvVars()
        }, function (err, result)
        {
            Logger.log("Started all containers");
            callback(err, result);
        });

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
            let dockerSubProcess = childProcess.exec(`/bin/bash -c "${checkIfCheckpointExistsScript} ${checkpointName}"`, {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2],
                env: DockerManager.getEnvVars()
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

            logEverythingFromChildProcess(dockerSubProcess);
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
                    let dockerSubProcess = childProcess.exec(`/bin/bash -c "${createCheckpointScript} ${checkpointName}"`, {
                        cwd: rlequire.getRootFolder("dendro"),
                        stdio: [0, 1, 2],
                        env: DockerManager.getEnvVars()
                    }, function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Saved checkpoint with name " + checkpointName);
                        }
                        callback(err, result);
                    });

                    logEverythingFromChildProcess(dockerSubProcess);
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
                    let dockerSubProcess = childProcess.exec(`/bin/bash -c "${restoreCheckpointScript} ${checkpointName}"`, {
                        cwd: rlequire.getRootFolder("dendro"),
                        stdio: [0, 1, 2],
                        env: DockerManager.getEnvVars()
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

                    logEverythingFromChildProcess(dockerSubProcess);
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

DockerManager.nukeAndRebuild = function (onlyOnce, callback)
{
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            Logger.log("Rebuilding all Docker containers.");

            let dockerSubProcess = childProcess.exec(`docker-compose down && docker-compose rm -s -v -f`, {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2],
                env: DockerManager.getEnvVars()
            }, function (err1, result)
            {
                const rimraf = require("rimraf");
                rimraf(Config.docker.environment_variables.VOLUMES_FOLDER, function(err2, result){
                    if (!isNull(err1) || !isNull(err2))
                    {
                        Logger.log("Unable to destroy existing containers.");
                        callback(err1 || err2, result);
                    }
                    else
                    {
                        let dockerSubProcess = childProcess.exec(`docker-compose up -d`, {
                            cwd: rlequire.getRootFolder("dendro"),
                            stdio: [0, 1, 2],
                            env: DockerManager.getEnvVars()
                        }, function (err, result)
                        {
                            callback(err, result);
                        });

                        logEverythingFromChildProcess(dockerSubProcess);
                    }
                });
            });

            logEverythingFromChildProcess(dockerSubProcess);
        };

        if (onlyOnce)
        {
            if (!DockerManager._nukedOnce)
            {
                performOperation();
                DockerManager._nukedOnce = true;
            }
            else
            {
                callback(null, null);
            }
        }
        else
        {
            performOperation();
        }
    }
};

DockerManager.restartContainers = function (onlyOnce, callback)
{
    Logger.log("Restarting all Docker containers.");
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            const dockerSubProcess = childProcess.exec("docker-compose restart -d", {
                cwd: rlequire.getRootFolder("dendro"),
                env: DockerManager.getEnvVars()
            }, function (err, result)
            {
                if (err)
                {

                }
                else
                {
                    Logger.log("Restarted all containers");
                }
                callback(err, result);
            });

            logEverythingFromChildProcess(dockerSubProcess);
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
