const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
const DockerCheckpointManager = require(Pathfinder.absPathInSrcFolder("utils/docker/checkpoint_manager.js")).DockerCheckpointManager;
const Logger = require(Pathfinder.absPathInSrcFolder("utils/logger.js")).Logger;

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
        unitUtils.loadCheckpoint(
            self.name,
            function (err, loadedCheckpoint)
            {
                if (!err)
                {
                    if (loadedCheckpoint)
                    {
                        Logger.log("info", "Checkpoint " + self.name + " recovered, running only init function");
                        self.prototype.init(function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        Logger.log("info", "Checkpoint " + self.name + " does not exist, running load function");
                        self.init(function (err, result)
                        {
                            self.load(function (err, result)
                            {
                                DockerCheckpointManager.createCheckpoint(
                                    self.name
                                );
                                callback(null);
                            });
                        });
                    }
                }
                else
                {
                    callback(err, restoreMessage);
                }
            }
        );
    }
}

module.exports = TestUnit;
