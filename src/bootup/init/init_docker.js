const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerManager = require(Pathfinder.absPathInSrcFolder("utils/docker/docker_manager.js")).DockerManager;

const initDockerContainers = function (app, callback)
{
    if (Config.docker && Config.docker.active && Config.docker.start_and_stop_containers_automatically)
    {
        try
        {
            DockerManager.startAllContainers(callback);
        }
        catch (e)
        {
            const msg = "Unable to start docker containers!" + JSON.stringify(e);
            Logger.log("error", msg);
            callback(e, msg);
        }
    }
    else
    {
        callback(null);
    }
};

module.exports.initDockerContainers = initDockerContainers;
