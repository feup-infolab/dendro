const path = require("path");

const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

class TestUnit
{
    static shutdown (callback)
    {
        callback(null);
    }

    static init (callback)
    {
        callback(null);
    }

    static load (callback)
    {
        if (!Config.docker.reuse_checkpoints)
        {
            DockerCheckpointManager.deleteAll(true, true);
            DockerCheckpointManager.nukeAndRebuild(true);
        }

        callback(null);
    }

    static setup (callback)
    {
        const self = this;
        const checkpointIdentifier = unitUtils.getCallerFunctionFilePath();
        const loadedCheckpoint = self.loadCheckpoint(checkpointIdentifier);

        callback(null, loadedCheckpoint);
    }

    static startLoad ()
    {
        const checkpointIdentifier = unitUtils.getCallerFunctionFilePath();
        unitUtils.start(checkpointIdentifier, "Seeding database...");
    }

    static endLoad (filename, callback)
    {
        const self = this;
        const checkpointIdentifier = unitUtils.getCallerFunctionFilePath();

        if (Config.docker.active)
        {
            Logger.log("Halting app after loading databases for creating checkpoint: " + checkpointIdentifier);

            self.shutdown(function (err, result)
            {
                if (!err)
                {
                    Logger.log("Halted app after loading databases for creating checkpoint: " + checkpointIdentifier);
                    self.createCheckpoint(checkpointIdentifier);
                    self.init(function (err, result)
                    {
                        callback(err, result);
                        unitUtils.end(checkpointIdentifier, "Ended database seeding.");
                    });
                }
                else
                {
                    Logger.log("error", "Error halting app after loading databases for creating checkpoint: " + checkpointIdentifier);
                    callback(err, result);
                }
            });
        }
        else
        {
            unitUtils.end(checkpointIdentifier, "Ended database seeding.");
            callback(null);
        }
    }

    static createCheckpoint (customIdentifier)
    {
        const self = this;
        if (!customIdentifier)
        {
            customIdentifier = self.name;
        }

        DockerCheckpointManager.createCheckpoint(customIdentifier);
    }

    static loadCheckpoint (customIdentifier)
    {
        const self = this;
        if (!customIdentifier)
        {
            customIdentifier = self.name;
        }

        return DockerCheckpointManager.restoreCheckpoint(customIdentifier);
    }
}

module.exports = TestUnit;
