process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const rlequire = require("rlequire");

const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const should = chai.should();
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const administerUtils = rlequire("dendro", "test/utils/administer/administerUtils.js");
const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1");
const admin = rlequire("dendro", "test/mockdata/users/admin");

const AddMetadataToFoldersPublicProject = rlequire("dendro", "test/units/metadata/addMetadataToFoldersPublicProject.Unit.js");

let app;
let agent;

describe("Resource re-indexing page ( /admin/reindex )", function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        AddMetadataToFoldersPublicProject.setup(function (err, res)
        {
            should.equal(err, null);
            app = global.tests.app;
            agent = chai.request.agent(app);
            done();
        });
    });
    describe("Invalid cases", function ()
    {
        it("Should not allow reindexing operation without being logged in", function (done)
        {
            administerUtils.reindexGraphs(agent,
                {
                    graphs_to_reindex: ["dendro_graph", "social_dendro", "notifications_dendro"],
                    graphs_to_delete: ["dendro_graph", "social_dendro", "notifications_dendro"]
                },
                function (err, res)
                {
                    res.should.have.status(401);
                    res.text.should.contain("You are not authorized to perform this operation. You must be a Dendro administrator.");
                    res.text.should.not.contain("System administration page");
                    done();
                });
        });

        it("Should not allow reindexing operation without being logged in as an administrator", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                administerUtils.reindexGraphs(agent,
                    {
                        graphs_to_reindex: ["dendro_graph", "social_dendro", "notifications_dendro"],
                        graphs_to_delete: ["dendro_graph", "social_dendro", "notifications_dendro"]
                    },
                    function (err, res)
                    {
                        res.should.have.status(401);
                        res.text.should.contain("You are not authorized to perform this operation. You must be a Dendro administrator.");
                        res.text.should.not.contain("System administration page");
                        done();
                    });
            });
        });

        /*
        it("Should not allow reindexing of an invalid graph", function (done)
        {
            userUtils.loginUser(admin.username, admin.password, function (err, agent)
            {
                administerUtils.reindexGraphs(agent,
                    {
                        graphs_to_reindex: ["dendro_graphIDONOTKNOWYOU", "social_dendro", "notifications_dendro"],
                        graphs_to_delete: ["dendro_graph", "social_dendro", "notifications_dendro"]
                    },
                    function (err, res)
                    {
                        res.should.have.status(400);
                        res.text.should.contain("You are not authorized to perform this operation. You must be a Dendro administrator.");
                        res.text.should.not.contain("System administration page");
                        done();
                    });
            });
        });
        */
    });

    describe("Valid cases", function ()
    {
        it("Should reindex the graphs if the user is an administrator", function (done)
        {
            userUtils.loginUser(admin.username, admin.password, function (err, agent)
            {
                administerUtils.reindexGraphs(
                    agent,
                    {
                        graphs_to_reindex: ["dendro_graph", "social_dendro", "notifications_dendro"],
                        graphs_to_delete: ["dendro_graph", "social_dendro", "notifications_dendro"]
                    },
                    function (err, res)
                    {
                        res.should.have.status(200);
                        res.text.should.contain("System administration page");
                        done();
                    });
            });
        });
    });
});
