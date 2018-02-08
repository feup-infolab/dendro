const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));
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
                        unitUtils.start(path.basename(__filename), "Checkpoint " + self.name + " recovered , running only init function");
                        self.prototype.init(function (err, result)
                        {
                            callback(err, result);
                        });
                    }
                    else
                    {
                        unitUtils.start(path.basename(__filename), "Checkpoint " + self.name + " does not exist, running load function");
                        self.init(function (err, result)
                        {
                            self.load(function (err, result)
                            {
                                unitUtils.createCheckpoint(
                                    self.name,
                                    function (err, result)
                                    {
                                        callback(err, result);
                                    });
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
