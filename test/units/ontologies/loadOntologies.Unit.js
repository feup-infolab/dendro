process.env.NODE_ENV = "test";

const Pathfinder = global.Pathfinder;

const chai = require("chai");
chai.use(require("chai-http"));
const path = require("path");

const TestUnit = require(Pathfinder.absPathInTestsFolder("units/testUnit.js"));

let loadOntologies = require(Pathfinder.absPathInSrcFolder("/bootup/load/load_ontologies.js")).loadOntologies;
let initCache = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_cache.js")).initCache;
let initVirtuoso = require(Pathfinder.absPathInSrcFolder("/bootup/init/init_virtuoso.js")).initVirtuoso;

class LoadOntologies extends TestUnit
{
    static load (callback)
    {
        const self = this;
        self.startLoad(path.basename(__filename));
        super.load(function (err, results)
        {
            if (err)
            {
                callback(err, results);
            }
            else
            {
                initVirtuoso(null, function (err, result)
                {
                    initCache(null, function (err, result)
                    {
                        loadOntologies(null, function (err, result)
                        {
                            self.endLoad(path.basename(__filename), callback);
                        }, true);
                    });
                });
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
}

module.exports = LoadOntologies;
