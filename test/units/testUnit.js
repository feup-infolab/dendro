class TestUnit
{
    static init (callback)
    {
        callback(null);
    }

    static load (callback)
    {
        const self = this;
        const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
        const path = require("path");

        unitUtils.loadCheckpointAndRun(
            self.name,
            function (err, restoreMessage)
            {
                if (!err)
                {
                    unitUtils.start(path.basename(__filename), restoreMessage);
                    callback(err, restoreMessage);
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
