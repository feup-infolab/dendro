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

    static setup (callback, customCheckpointIdentifier)
    {
        callback(null);
    }

    static startLoad (filename)
    {
        if (!filename)
        {
            throw new Error("No unit filename specified!");
        }

        unitUtils.start(path.parse(filename).name, "Seeding database...");
    }

    static endLoad (filename, callback, customCheckpointIdentifier)
    {
        const self = this;
        if (!customCheckpointIdentifier)
        {
            customCheckpointIdentifier = path.parse(filename).name;
        }

        if(Config.docker.active)
        {
            Logger.log("Halting app after loading databases for creating checkpoint: " + customCheckpointIdentifier);

            self.shutdown(function (err, result)
            {
                if (!err)
                {
                    Logger.log("Halted app after loading databases for creating checkpoint: " + customCheckpointIdentifier);
                    self.createCheckpoint(customCheckpointIdentifier);
                    self.init(function (err, result)
                    {
                        callback(err, result);
                        unitUtils.end(path.parse(filename).name, "Ended database seeding.");
                    });
                }
                else
                {
                    Logger.log("error", "Error halting app after loading databases for creating checkpoint: " + customCheckpointIdentifier);
                    callback(err, result);
                }
            });
        }
        else
        {
            unitUtils.end(path.parse(filename).name, "Ended database seeding.");
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
