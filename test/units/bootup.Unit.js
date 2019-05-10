process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Logger = rlequire("dendro", "src/utils/logger.js").Logger;
const isNull = rlequire("dendro", "src/utils/null.js").isNull;

const TestUnit = rlequire("dendro", "test/units/testUnit.js");
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

class BootupUnit extends TestUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        const dendroInstance = Config.tests.dendroInstance;
        dendroInstance.seedDatabases(function (err, result)
        {
            if (isNull(err))
            {
                unitUtils.endLoad(self, function (err, results)
                {
                    callback(err, dendroInstance.app);
                });
            }
            else
            {
                Logger.log("error", "Error seeding databases when booting up dendro instance!");
                Logger.log("error", err);
                Logger.log("error", result);
                callback(err, result);
            }
        });
    }

    static shutdown (callback)
    {
        super.shutdown(function (err, result)
        {
            unitUtils.shutdown(function (err, result)
            {
                callback(err, result);
            });
        });
    }

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }

    static init (callback)
    {
        unitUtils.init(callback);
    }
}

module.exports = BootupUnit;
