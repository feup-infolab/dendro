const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const projectUtils = rlequire("dendro", "test/utils/project/projectUtils.js");
const repositoryUtils = rlequire("dendro", "test/utils/repository/repositoryUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const createExportToRepositoriesConfigsUnit = rlequire("dendro", "test/units/repositories/createExportToRepositoriesConfigs.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("List all external repository tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createExportToRepositoriesConfigsUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("/external_repositories", function ()
    {
        it("[HTML] should refuse the request if the Accept: 'application/json' header is not present with authenticated user(demouser1)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.getAllExternalRepositories(false, agent, function (err, res)
                {
                    res.text.should.contain("You are not authorized to perform this operation. You must be signed into Dendro.");
                    done();
                });
            });
        });

        it("[HTML] should refuse the request if the Accept: 'application/json' header is not present with unauthenticated user", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            repositoryUtils.getAllExternalRepositories(false, agent, function (err, res)
            {
                res.text.should.contain("You are not authorized to perform this operation. You must be signed into Dendro.");
                done();
            });
        });

        it("[JSON] should refuse the request if the user is unauthenticated.", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            repositoryUtils.getAllExternalRepositories(true, agent, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it("[JSON] should refuse the request if the user is authenticated but is not a Dendro administrator.", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                repositoryUtils.getAllExternalRepositories(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it("[HTML] should refuse the request if the Accept: 'application/json' header is not present, even if the user is authenticated as admin", function (done)
        {
            userUtils.loginUser("admin", "adminteste123", function (err, agent)
            {
                repositoryUtils.getAllExternalRepositories(false, agent, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    done();
                });
            });
        });

        it("[JSON] should give the external_repositories if the Accept: 'application/json' header is present, and the user is authenticated as a Dendro admin", function (done)
        {
            userUtils.loginUser("admin", "adminteste123", function (err, agent)
            {
                repositoryUtils.getAllExternalRepositories(true, agent, function (err, res)
                {
                    res.statusCode.should.equal(200);
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
            done(err);
        });
    });
});
