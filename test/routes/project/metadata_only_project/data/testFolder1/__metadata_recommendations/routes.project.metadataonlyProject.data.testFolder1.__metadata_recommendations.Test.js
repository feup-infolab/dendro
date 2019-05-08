const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const itemUtils = rlequire("dendro", "test/utils/item/itemUtils.js");
const repositoryUtils = rlequire("dendro", "test/utils/repository/repositoryUtils.js");
const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");

const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

const metadataProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder1 = rlequire("dendro", "test/mockdata/folders/testFolder1.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Metadata only project testFolder1 level metadata_recommendations tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        addMetadataToFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe(metadataProject.handle + "/data/" + testFolder1.name + "?metadata_recommendations", function ()
    {
        it("[HTML] should refuse the request if \"application/json\" Accept header is absent", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it("[JSON] should forbid requests for recommendations in project " + metadataProject.handle + " if no user is authenticated.", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);

            itemUtils.getItemMetadataRecommendations(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                should.not.exist(res.body.descriptors);
                done();
            });
        });

        it("[JSON] should allow requests for recommendations in project " + metadataProject.handle + " if user " + demouser1.username + " is authenticated (creator).", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should allow requests for recommendations in project " + metadataProject.handle + " if user " + demouser2.username + " is authenticated (contributor).", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should forbid requests for recommendations in project " + metadataProject.handle + " if user " + demouser3.username + " is authenticated (not contributor nor creator).", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it("[JSON] Should give a not found error for recommendations for the notFoundFolder", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, metadataProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });
    });

    describe(metadataProject.handle + "/data/" + testFolder1.name + "?metadata_recommendations", function ()
    {
        it("[HTML] should refuse the request if \"application/json\" Accept header is absent", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it("[JSON] should forbid requests for recommendations in project " + invalidProject.handle + " if no user is authenticated.", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);

            itemUtils.getItemMetadataRecommendations(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                should.not.exist(res.body.descriptors);
                done();
            });
        });

        it("[JSON] should give not found for recommendations in project " + invalidProject.handle + " if user " + demouser1.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it("[JSON] should give not found for recommendations in project " + invalidProject.handle + " if user " + demouser2.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it("[JSON] should give not found for recommendations in project " + invalidProject.handle + " if user " + demouser3.username + " is authenticated.", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemMetadataRecommendations(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
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
