const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");
const async = require("async");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const socialDendroUtils = rlequire("dendro", "test/utils/social/socialDendroUtils");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const createSocialDendroTimelineWithPostsAndSharesUnit = rlequire("dendro", "test/units/social/createSocialDendroTimelineWithPostsAndShares.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Social Dendro user timeline tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        // creates the 3 type of posts for the 3 types of projects(public, private, metadataOnly)
            should.equal(err, null);
            done();
    });

    describe("[GET] Gets the Social Dendro timeline for each user [Valid cases] /social/my", function ()
    {
        it("[For an unauthenticated user] Should give an unauthorized error", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            socialDendroUtils.getMySocialDendroTimeline(true, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.message.should.equal("Error detected. You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[For demouser1, as the creator of all projects] Should init the timeline with an array of post URIs", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                socialDendroUtils.getMySocialDendroTimeline(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.not.contain("initTimeline('[]', '0');");
                    done();
                });
            });
        });

        it("[For demouser2, a collaborator in all projects] Should init the timeline with an array of post URIs", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                socialDendroUtils.getMySocialDendroTimeline(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.not.contain("initTimeline('[]', '0');");
                    done();
                });
            });
        });

        it("[For demouser3, is not a creator or collaborator in any projects] Should init the timeline with an EMPTY array of post URIs", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                socialDendroUtils.getMySocialDendroTimeline(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.text.should.contain("initTimeline('[]', '0');");
                    done();
                });
            });
        });
    });

    after(function (done)
    {
        // destroy graphs

        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
