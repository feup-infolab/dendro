const rlequire = require("rlequire");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

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

    static setup (callback, forceLoad)
    {
        const self = this;
        unitUtils.setup(self, callback, forceLoad);
    }
}

module.exports = TestUnit;
