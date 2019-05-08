const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");

const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

let bootupUnit = rlequire("dendro", "test/units/bootup.Unit.js");

describe("Initial clean-up...", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        bootupUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("Clean everything", function ()
    {
        it("Should destroy all test graphs", function (done)
        {
            // destroy graphs

            appUtils.clearAppState(function (err, data)
            {
                should.equal(err, null);
                done();
            });
        });
    });
});
