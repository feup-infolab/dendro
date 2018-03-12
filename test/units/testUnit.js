const path = require("path");
const _ = require("underscore");

const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

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

        if(typeof super.setup === "function")
        {
            super.setup(function(err, result){
                unitUtils.setup(self, callback);
            });
        }
        else
        {
            callback(null);
        }
    }
}

module.exports = TestUnit;
