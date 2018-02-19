const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;
const path = require("path");

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

    static setup (callback)
    {
        const self = this;
        const loadedCheckpoint = self.loadCheckpoint();

        if (loadedCheckpoint)
        {
            Logger.log("info", "Checkpoint " + self.name + "exists and was recovered. Running only init function.");
            self.init(function (err, result)
            {
                Logger.log("info", "Ran only init function of " + self.name);
                callback(err, result);
            });
        }
        else
        {
            Logger.log("info", "Checkpoint " + self.name + " does not exist. Will load database...");
            self.init(function (err, result)
            {
                Logger.log("info", "Finished init function of " + self.name);
                self.load(function (err, result)
                {
                    Logger.log("info", "Finished load function of " + self.name);
                    callback(null);
                });
            });
        }
    }

    static startLoad (filename, customIdentifier)
    {
        const self = this;
        if (!customIdentifier)
        {
            customIdentifier = path.basename(self.name);
        }

        unitUtils.start(customIdentifier, "Seeding database...");
    }

    static endLoad (filename, customIdentifier)
    {
        const self = this;
        if (!customIdentifier)
        {
            customIdentifier = path.basename(self.name);
        }

        self.createCheckpoint(customIdentifier);
        unitUtils.end(customIdentifier, "Database seeding complete.");
    }

    static createCheckpoint (filename)
    {
        const self = this;
        if (!filename)
        {
            filename = self.name;
        }

        DockerCheckpointManager.createCheckpoint(filename);
    }

    static loadCheckpoint ()
    {
        const self = this;
        return DockerCheckpointManager.restoreCheckpoint(self.name);
    }
}

module.exports = TestUnit;
