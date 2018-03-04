process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const path = require("path");

let BootupUnit = require(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));

let loadOntologies = require(Pathfinder.absPathInSrcFolder("/bootup/load/load_ontologies.js")).loadOntologies;

class LoadOntologies extends BootupUnit
{
    static load (callback)
    {
        const self = this;
        self.startLoad(__filename);
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                loadOntologies(null, function (err, result)
                {
                    self.endLoad(__filename, callback);
                }, true);
            }
        });
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
