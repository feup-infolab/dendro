const Pathfinder = global.Pathfinder;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

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
        callback(null);
    }

    static setup (callback)
    {
        const self = this;
        unitUtils.setup(self, callback);
    }
}

module.exports = TestUnit;
