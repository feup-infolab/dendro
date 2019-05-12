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

const metadataProject = rlequire("dendro", "test/mockdata/projects/metadata_only_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Metadata only project level metadata tests", function ()
{
    this.timeout(Config.tests.timeout);
    before(function (done)
    {
        should.equal(err, null);
        done();
    });

    describe(metadataProject.handle + "?metadata (metadata only project)", function ()
    {
        /**
         * Valid request type
         */
        it("[JSON] should fetch metadata of the " + metadataProject.handle + " project without authenticating", function (done)
        {
            const app = Config.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.getProjectMetadata(true, agent, metadataProject.handle, function (err, res)
            {
                res.statusCode.should.equal(200);
                res.body.descriptors.should.be.instanceof(Array);
                should.not.exist(res.body.hasLogicalParts);// The hasLogicalParts array in the body response should only be present in the metadata&deep request
                done();
            });
        });

        it("[JSON] should fetch metadata of the " + metadataProject.handle + " project, authenticated as " + demouser1.username + " (creator)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, metadataProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    should.not.exist(res.body.hasLogicalParts);// The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it("[JSON] should fetch metadata of the " + metadataProject.handle + " project, authenticated as " + demouser3.username + " (not creator nor contributor)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, metadataProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    should.not.exist(res.body.hasLogicalParts);// The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it("[JSON] should fetch metadata of the " + metadataProject.handle + " project, authenticated as " + demouser2.username + " (contributor)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, metadataProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    should.not.exist(res.body.hasLogicalParts);// The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });
    });

    describe("/project/NON_EXISTENT_PROJECT?metadata (non-existant project)", function ()
    {
        it("[HTML] should give an error that the project does not exist because the project NON_EXISTENT_PROJECT does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(false, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    // Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                    res.text.should.include("Resource not found at uri");
                    should.not.exist(res.body.descriptors);
                    // The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it("[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.getProjectMetadata(true, agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    // The hasLogicalParts array in the body response should only be present in the metadata&deep request

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
