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

    static setup (callback, customCheckpointIdentifier)
    {
        const self = this;
        const loadedCheckpoint = self.loadCheckpoint(customCheckpointIdentifier);

        if (loadedCheckpoint)
        {
            Logger.log("Checkpoint " + self.name + "exists and was recovered.");
            self.init(function (err, result)
            {
                Logger.log("Ran only init function of " + self.name);
                callback(err, result);
            });
        }
        else
        {
            Logger.log("Checkpoint " + self.name + " does not exist. Will load database...");
            self.load(function (err, result)
            {
                Logger.log("Gracefully starting app again after loading databases in " + self.name);
                self.init(function (err, result)
                {
                    Logger.log("Finished load function of " + self.name);
                    callback(null);
                });
            });
        }
    }

    static startLoad (filename)
    {
        const self = this;
        if (!filename)
        {
            filename = self.name;
        }

        unitUtils.start(filename, "Seeding database...");
    }

    static endLoad (filename, callback, customCheckpointIdentifier)
    {
        const self = this;
        if (!customCheckpointIdentifier)
        {
            customCheckpointIdentifier = self.name;
        }

        Logger.log("Halting app after loading databases in " + self.name);

        self.shutdown(function (err, result)
        {
            if(!err)
            {
                Logger.log("Halted app after loading databases in " + self.name + " for creating a checkpoint.");
                self.createCheckpoint(customCheckpointIdentifier);
                callback(err, result);
            }
            else
            {
                Logger.log("error", "Error halting app after loading databases in " + self.name + " for creating a checkpoint.");
                callback(err, result);
            }
        });
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
