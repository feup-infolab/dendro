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

const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Private project level recommendation_ontologies", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        addMetadataToFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    /**
     * Project-level recommendation of descriptors
     */
    describe(privateProject.handle + "?recommendation_ontologies", function ()
    {
        it("[HTML] should refuse the request if \"application/json\" Accept header is absent", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(false, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should forbid ontology recommendation requests in project " + privateProject.handle + " if no user is authenticated.", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.getRecommendationOntologiesForProject(true, agent, privateProject.handle, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.should.not.be.instanceof(Array);
                done();
            });
        });

        it("[JSON] should allow ontology recommendation requests in project " + privateProject.handle + " if user " + demouser1.username + " is authenticated (creator).", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should forbid ontology recommendation requests in project " + privateProject.handle + " if user " + demouser3.username + " is authenticated (not contributor nor creator).", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should allow ontology recommendation requests in project " + privateProject.handle + " if user " + demouser2.username + " is authenticated (contributor).", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, privateProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.should.be.instanceof(Array);
                    done();
                });
            });
        });
    });

    describe(invalidProject.handle + "?recommendation_ontologies", function ()
    {
        it("[HTML] should refuse the request if \"application/json\" Accept header is absent", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(false, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should forbid requests for recommendations in folder " + invalidProject.handle + " if no user is authenticated.", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.getRecommendationOntologiesForProject(true, agent, invalidProject.handle, function (err, res)
            {
                res.statusCode.should.equal(401);
                res.body.should.not.be.instanceof(Array);
                done();
            });
        });

        it("[JSON] should give a not found error for requests for recommendations in project " + invalidProject.handle + " if user " + demouser1.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should give a not found error for requests for recommendations in project " + invalidProject.handle + " if user " + demouser3.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.should.not.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should give a not found error for requests for recommendations in project " + invalidProject.handle + " if user " + demouser2.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getRecommendationOntologiesForProject(true, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.should.not.be.instanceof(Array);
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
