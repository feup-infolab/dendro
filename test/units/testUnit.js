const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;

class TestUnit
{
    static init (callback)
    {
        callback(null);
    }

    static load (callback)
    {
        callback(null);
    }

    static setup (callback, customCheckpointIdentifier)
    {
        const self = this;
        const loadedCheckpoint = self.loadCheckpoint(customCheckpointIdentifier);

        if (loadedCheckpoint)
        {
            Logger.log("Checkpoint " + self.name + "exists and was recovered. Running only init function.");
            self.init(function (err, result)
            {
                Logger.log("Ran only init function of " + self.name);
                callback(err, result);
            });
        }
        else
        {
            Logger.log("Checkpoint " + self.name + " does not exist. Will load database...");
            self.init(function (err, result)
            {
                Logger.log("Finished init function of " + self.name);
                self.load(function (err, result)
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

    static endLoad (filename, customCheckpointIdentifier)
    {
        const self = this;
        if (!customCheckpointIdentifier)
        {
            customCheckpointIdentifier = self.name;
        }

        self.createCheckpoint(customCheckpointIdentifier);
        unitUtils.end(filename, "Database seeding complete.");
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
