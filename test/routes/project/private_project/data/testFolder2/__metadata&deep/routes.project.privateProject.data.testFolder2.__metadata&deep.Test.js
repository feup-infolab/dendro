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

const privateProject = rlequire("dendro", "test/mockdata/projects/private_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const testFolder2 = rlequire("dendro", "test/mockdata/folders/testFolder2.js");
const notFoundFolder = rlequire("dendro", "test/mockdata/folders/notFoundFolder.js");

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Private project testFolder2 level metadata&deep tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        addMetadataToFoldersUnit.init(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("/project/" + privateProject.handle + "/data/" + testFolder2.name + "?metadata&deep (private project)", function ()
    {
        /**
         * Invalid request type
         */
        it("[HTML] should refuse request if Accept application/json was not specified", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(false, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);

                    done();
                });
            });
        });

        /**
         * Valid request type
         */
        it("[JSON] should refuse to fetch metadata recursively of the " + privateProject.handle + "/data/" + testFolder2.name + " resource without authenticating", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.getItemMetadataDeep(true, agent, privateProject.handle, testFolder2.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                should.not.exist(res.body.descriptors);
                should.not.exist(res.body.hasLogicalParts);
                done();
            });
        });

        it("[JSON] should fetch metadata recursively of the " + privateProject.handle + "/data/" + testFolder2.name + " resource, authenticated as " + demouser1.username + " (creator)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.hasLogicalParts.should.be.instanceof(Array);// only because this is a metadata&deep request
                    done();
                });
            });
        });

        it("[JSON] should refuse to fetch metadata recursively of the " + privateProject.handle + "/data/" + testFolder2.name + " resource, authenticated as " + demouser3.username + " (not creator nor contributor)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    should.not.exist(res.body.descriptors);

                    done();
                });
            });
        });

        it("[JSON] should fetch metadata recursively of the " + privateProject.handle + "/data/" + testFolder2.name + " resource, authenticated as " + demouser2.username + " (contributor)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.hasLogicalParts.should.be.instanceof(Array);// only because this is a metadata&deep request
                    done();
                });
            });
        });
    });

    describe(privateProject.handle + "/data/" + testFolder2.name + "?metadata&deep (non-existant project)", function ()
    {
        it("[HTML] should refuse request if Accept application/json was not specified", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(false, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);

                    done();
                });
            });
        });

        it("[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemMetadataDeep(true, agent, invalidProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);

                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an("array");
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(invalidProject.handle);
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
