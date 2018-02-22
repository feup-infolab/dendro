const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const Pathfinder = require("../../src/models/meta/pathfinder").Pathfinder;

const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;
const loadOntologiesUnit = require(Pathfinder.absPathInTestsFolder("units/ontologies/loadOntologies.Unit.js"));

describe("Loading ontologies cache only once...", function ()
{
    this.timeout(Config.testsTimeout);
    it("Should load all ontologies into cache.", function (done)
    {
        loadOntologiesUnit.setup(done);
    });
});
