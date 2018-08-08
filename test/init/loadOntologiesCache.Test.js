const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const loadOntologiesUnit = rlequire("dendro", "test/units/ontologies/loadOntologies.Unit.js");

describe("Loading ontologies cache only once...", function ()
{
    this.timeout(Config.testsTimeout);
    it("Should load all ontologies into cache.", function (done)
    {
        loadOntologiesUnit.setup(done);
    });
});
