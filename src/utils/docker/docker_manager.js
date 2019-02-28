const fs = require("fs");
const path = require("path");
const async = require("async");
const _ = require("underscore");

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;

const childProcess = require("child_process");

const DockerManager = function ()
{
};

if (process.env.NODE_ENV === "test")
{
    DockerManager.defaultOrchestra = "dendro-test";
}
else
{
    DockerManager.defaultOrchestra = "dendro";
}

DockerManager.runningOrchestras = {};

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
    DockerManager.stopOrchestra(DockerManager.defaultOrchestra, callback);
};

DockerManager.startAllContainers = function (callback, imagesSuffix)
{
    DockerManager.startOrchestra(DockerManager.defaultOrchestra, callback, imagesSuffix);
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
            DockerManager.getInfoOfAllServicesInOrchestra(DockerManager.defaultOrchestra, function (err, images)
            {
                async.map(images, function (image, callback)
                {
                    childProcess.exec(`docker image inspect "${image.image}${checkpointName}"`, {
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
                }, function (err, results)
                {
                    const allImagesExist = !_.find(results, function (result)
                    {
                        return result === false;
                    });

                    callback(err, allImagesExist);
                });
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
                    DockerManager.commitAllContainersInOrchestra(function (err, result)
                    {
                        if (isNull(err))
                        {
                            Logger.log("Saved checkpoint with name " + checkpointName);
                        }
                        callback(err, result);
                    }, DockerManager.defaultOrchestra, checkpointName);
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
                    DockerManager.stopAllOrchestras(function (err, result)
                    {
                        DockerManager.startAllContainers(function(err, result){
                            callback(err, result);
                        }, checkpointName);
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

// DockerManager.nukeAndRebuild = function (onlyOnce, callback)
// {
//     if (Config.docker && Config.docker.active)
//     {
//         const performOperation = function ()
//         {
//             Logger.log("Rebuilding all Docker containers.");
//
//             DockerManager.stopAllOrchestras(function (err, result)
//             {
//                 DockerManager.destroyAllOrchestras(callback);
//                 childProcess.execSync(`docker-compose rm -s`, {
//                     cwd: rlequire.getRootFolder("dendro"),
//                     stdio: [0, 1, 2]
//                 });
//             });
//         };
//
//
//
//         callback(null);
//     }
// };

DockerManager.restartContainers = function (onlyOnce)
{
    Logger.log("Restarting all Docker containers.");
    if (Config.docker && Config.docker.active)
    {
        const performOperation = function ()
        {
            childProcess.execSync("docker-compose down; docker-compose up", {
                cwd: rlequire.getRootFolder("dendro"),
                stdio: [0, 1, 2]
            });

            Logger.log("Restarted all containers");
            DockerManager._restartedOnce = true;
        };

        if (onlyOnce)
        {
            if (!DockerManager._restartedOnce)
            {
                performOperation();
            }
        }
        else
        {
            performOperation();
        }
        Logger.log("Restarted all containers.");
    }
};

DockerManager.forAllOrchestrasDo = function (lambda, callback)
{
    const dir = require("node-dir");
    const orchestrasDir = path.resolve(rlequire.getRootFolder("dendro"), "orchestras");
    dir.files(
        orchestrasDir,
        "dir",
        function (err, subdirs)
        {
            async.map(subdirs, function (subdir, singleLambdaCallback)
            {
                const orchestraName = path.basename(subdir);
                lambda(subdir, singleLambdaCallback, orchestraName);
            }, callback);
        },
        {
            recursive: false
        });
};

DockerManager.destroyAllOrchestras = function (callback, onlyOnce)
{
    const performOperation = function (callback)
    {
        DockerManager.forAllOrchestrasDo(function (subdir, callback)
        {
            const dockerSubProcess = childProcess.exec("docker-compose down --rmi local", {
                cwd: subdir
            }, function (err, result)
            {
                DockerManager._nukedOnce = true;
                callback(err, result);
            });

            logEverythingFromChildProcess(dockerSubProcess);
        }, callback);
    };

    if (onlyOnce)
    {
        if (!DockerManager._nukedOnce)
        {
            performOperation(callback);
        }
    }
    else
    {
        performOperation(callback);
    }
};

DockerManager.fetchAllOrchestras = function (callback, onlyOnce)
{
    if (!onlyOnce || onlyOnce && isNull(DockerManager.__fetchedAllImages))
    {
        DockerManager.forAllOrchestrasDo(function (subdir, callback)
        {
            const dockerSubProcess = childProcess.exec("docker-compose pull", {
                cwd: subdir
            }, callback);

            logEverythingFromChildProcess(dockerSubProcess);
        }, function ()
        {
            DockerManager.__fetchedAllImages = true;
            callback();
        });
    }
    else
    {
        callback();
    }
};

DockerManager.requireOrchestras = function (orchestraName, req, res, next)
{
    DockerManager.startOrchestra(orchestraName, function (err, result)
    {
        next();
    });
};

DockerManager.startOrchestra = function (orchestraName, callback, imagesSuffix)
{
    if (Config.docker && Config.docker.active)
    {
        if (orchestraName instanceof Array)
        {
            async.mapSeries(
                orchestraName,
                function (singleOrchestraName, cb2)
                {
                    DockerManager.startOrchestra(singleOrchestraName, function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error occurred while starting orchestra " + singleOrchestraName);
                            Logger.log("error", err.message);
                        }

                        cb2(err, result);
                    }, imagesSuffix);
                },
                function (err, results)
                {
                    callback(err, results);
                });
        }
        else
        {
            Logger.log("Starting all Docker containers in orchestra " + orchestraName);
            Logger.log("info", "PLEASE WAIT! If after 10 minutes without heavy CPU activity please press Ctrl+C and try again.");

            let dockerSubProcess;
            if (isNull(DockerManager.runningOrchestras[orchestraName]))
            {
                const dockerComposeFolder = path.resolve(rlequire.getRootFolder("dendro"), "./orchestras/" + orchestraName);

                let copyOfEnv = JSON.parse(JSON.stringify(process.env));

                if (!isNull(imagesSuffix))
                {
                    Logger.log("Docker containers in orchestra " + orchestraName + " starting with state "+ imagesSuffix);
                    _.extend(copyOfEnv, {"DENDRO_DOCKER_CONTAINERS_SUFFIX" : imagesSuffix});
                }

                dockerSubProcess = childProcess.exec("docker-compose up -d --no-recreate", {
                    cwd: dockerComposeFolder,
                    env: copyOfEnv
                }, function (err, result)
                {
                    Logger.log("Started all containers in orchestra " + orchestraName);

                    if (!isNull(err))
                    {
                        if (err.message)
                        {
                            const matchName = err.message.match(/ERROR: for .* Cannot create container for service .* Conflict. The container name .* is already in use by container .* You have to remove \(or rename\) that container to be able to reuse that name./);

                            if (!isNull(matchName) && matchName.length > 0)
                            {
                                DockerManager.runningOrchestras[orchestraName] = {
                                    id: orchestraName,
                                    dockerComposeFolder: dockerComposeFolder
                                };

                                // TODO we ignore errors because in many cases a container with that name is already running.
                                // TODO Need a way to detect and manage containers witht the same names...

                                if (!isNull(imagesSuffix))
                                {
                                    callback(null, imagesSuffix);
                                }
                                else
                                {
                                    callback(null);
                                }
                            }
                            else
                            {
                                callback(err, null);
                            }
                        }
                        else
                        {
                            callback(err, null);
                        }
                    }
                    else
                    {
                        DockerManager.runningOrchestras[orchestraName] = {
                            id: orchestraName,
                            dockerComposeFolder: dockerComposeFolder
                        };
                        if (!isNull(imagesSuffix))
                        {
                            callback(null, imagesSuffix);
                        }
                        else
                        {
                            callback(null);
                        }
                    }
                });
                logEverythingFromChildProcess(dockerSubProcess);
            }
            else
            {
                Logger.log("debug", "Containers in orchestra " + orchestraName + " are already running.");
                callback(null, null);
            }
        }
    }
    else
    {
        callback(null);
    }
};

DockerManager.stopOrchestra = function (orchestraName, callback)
{
    if (Config.docker && Config.docker.active)
    {
        if (orchestraName instanceof Array)
        {
            async.mapSeries(
                orchestraName,
                function (singleOrchestraName, callback)
                {
                    DockerManager.startOrchestra(singleOrchestraName, function (err, result)
                    {
                        if (!isNull(err))
                        {
                            Logger.log("error", "Error occurred while stopping orchestra " + singleOrchestraName);
                            Logger.log("error", err.message);
                        }

                        callback(err, result);
                    });
                },
                function (err, results)
                {
                    callback(err, results);
                });
        }
        else
        {
            Logger.log("Stopping all Docker containers in orchestra " + orchestraName);
            Logger.log("warn", "If it takes long in the first boot PLEASE WAIT! If after 10 minutes without heavy CPU activity please press Ctrl+C and try again.");

            let dockerSubProcess;

            if (!isNull(DockerManager.runningOrchestras[orchestraName]))
            {
                dockerSubProcess = childProcess.exec("docker-compose down", {
                    cwd: path.resolve(rlequire.getRootFolder("dendro"), "./orchestras/" + orchestraName),
                    stdio: [0, 1, 2]
                }, function (err, result)
                {
                    if (isNull(err))
                    {
                        DockerManager.runningOrchestras[orchestraName] = null;
                    }

                    Logger.log("Started all containers in orchestra " + orchestraName);
                    callback(err, result);
                });
            }
            else
            {
                Logger.log("debug", "Containers in orchestra " + orchestraName + " are not running, no need to stop them.");
                callback(null, null);
            }

            logEverythingFromChildProcess(dockerSubProcess);
        }
    }
    else
    {
        callback(null);
    }
};

DockerManager.stopAllOrchestras = function (callback)
{
    async.mapSeries(Object.keys(DockerManager.runningOrchestras), function (orchestra, callback)
    {
        DockerManager.stopOrchestra(orchestra, callback);
    },
    function (err, results)
    {
        callback(err, results);
    });
};

DockerManager.getInfoOfAllServicesInOrchestra = function (orchestra, callback)
{
    if (isNull(orchestra))
    {
        orchestra = DockerManager.defaultOrchestra;
    }

    if (isNull(DockerManager._containersInOrchestra))
    {
        DockerManager._containersInOrchestra = {};
        DockerManager.forAllOrchestrasDo(function (subdir, callback, orchestraName)
        {
            const yaml = require("js-yaml");
            const dockerComposeFileContents = yaml.safeLoad(fs.readFileSync(path.join(subdir, "docker-compose.yml")));

            const containerKeys = Object.keys(dockerComposeFileContents.services);

            DockerManager._containersInOrchestra[orchestraName] = [];

            for (let i = 0; i < containerKeys.length; i++)
            {
                let containerKey = containerKeys[i];
                let container = dockerComposeFileContents.services[containerKey];

                DockerManager._containersInOrchestra[orchestraName].push({
                    name: container.container_name,
                    image: container.image.replace(/\${.*}/g, "")
                });
            }

            callback(null);
        }, function (err, result)
        {
            callback(err, DockerManager._containersInOrchestra[orchestra]);
        });
    }
    else
    {
        callback(null, DockerManager._containersInOrchestra[orchestra]);
    }
};

DockerManager.commitAllContainersInOrchestra = function (callback, orchestra, committedImagesSuffix)
{
    DockerManager.getInfoOfAllServicesInOrchestra(orchestra, function (err, names)
    {
        if (isNull(err))
        {
            async.map(names, function (containerInformation, callback)
            {
                const containerName = containerInformation.name;
                let imageNameNoVars = containerInformation.image;

                DockerManager.commitContainer(containerName, `${imageNameNoVars}${committedImagesSuffix}`, callback);
            }, callback);
        }
        else
        {
            callback(err, names);
        }
    });
};

DockerManager.getContainerIDFromName = function (containerName, callback)
{
    childProcess.exec(`docker inspect --format="{{.Id}}" "${containerName}"`, {
        cwd: rlequire.getRootFolder("dendro"),
        stdio: [0, 1, 2]
    }, function (err, containerID)
    {
        callback(err, containerID.trim());
    });
};

DockerManager.commitContainer = function (containerName, committedImageName, callback)
{
    DockerManager.getContainerIDFromName(containerName, function (err, containerID)
    {
        childProcess.exec(`docker commit -p "${containerID}" "${committedImageName}"`, {
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
    });
};

module.exports.DockerManager = DockerManager;
