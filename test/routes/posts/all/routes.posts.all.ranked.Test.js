const chai = require("chai");
const rlequire = require("rlequire");
const chaiHttp = require("chai-http");
const should = chai.should();
chai.use(chaiHttp);

const Config = rlequire("dendro", "src/models/meta/config.js").Config;
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const socialDendroUtils = rlequire("dendro", "test/utils/social/socialDendroUtils");

const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");
const pageNumber = 1;
const useRank = 1;

describe("Get all posts URIs with pagination tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, rmetadataOnly)
        createSocialDendroTimelineWithPostsAndSharesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("[GET] Gets all posts URIs(with pagination) for each user [Valid cases] /posts/all", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            socialDendroUtils.getPostsURIsForUser(true, agent, pageNumber, useRank, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });
    });

    after(function (done)
    {
        // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done(err);
        });
    });
});
