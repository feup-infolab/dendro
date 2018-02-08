const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
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
        unitUtils.loadCheckpoint(
            self.name,
            function (err, loadedCheckpoint)
            {
                if (!err)
                {
                    if (loadedCheckpoint)
                    {
                        unitUtils.start(self.name, "Checkpoint " + self.name + " recovered, running only init function");
                        self.prototype.init(function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        unitUtils.start(self.name, "Checkpoint " + self.name + " does not exist, running load function");
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
