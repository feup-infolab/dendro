process.env.NODE_ENV = "test";

const rlequire = require("rlequire");

const chai = require("chai");
chai.use(require("chai-http"));
const path = require("path");

let BootupUnit = rlequire("dendro", "test/units/bootup.Unit.js");

let loadOntologies = rlequire("dendro", "src/bootup/load/load_ontologies.js").loadOntologies;
const unitUtils = rlequire("dendro", "test/utils/units/unitUtils.js");

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

    static setup (callback, forceLoad)
    {
        super.setup(callback, forceLoad);
    }
}

(async () => {await require("@feup-infolab/docker-mocha").runSetup(LoadOntologies);})();

module.exports = LoadOntologies;
