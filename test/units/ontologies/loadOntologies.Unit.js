process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const path = require("path");

let BootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));

let loadOntologies = require(Pathfinder.absPathInSrcFolder("/bootup/load/load_ontologies.js")).loadOntologies;
const unitUtils = require(Pathfinder.absPathInTestsFolder("utils/units/unitUtils.js"));

class LoadOntologies extends BootupUnit
{
    static load (callback)
    {
        const self = this;
        unitUtils.startLoad(self);
        loadOntologies(null, function (err, result)
        {
            unitUtils.endLoad(self, callback);
        }, true);
    }

    static init (callback)
    {
        super.init(callback);
    }

    static shutdown (callback)
    {
        super.shutdown(callback);
    }

    static setup (callback)
    {
        super.setup(callback);
    }
}

module.exports = LoadOntologies;
