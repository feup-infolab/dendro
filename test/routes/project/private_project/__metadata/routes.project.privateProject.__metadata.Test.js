var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const projectUtils = require(Config.absPathInTestsFolder("utils/project/projectUtils.js"));
const repositoryUtils = require(Config.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const privateProject = require(Config.absPathInTestsFolder("mockdata/projects/private_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

var addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Private project level metadata tests", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe(privateProject.handle+"?metadata (private project)", function ()
    {
        /**
         * Invalid request type
         */
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadata(false, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        /**
         * Valid request type
         */
        it('[JSON] should NOT fetch metadata of the ' + privateProject.handle + ' project without authenticating', function (done)
        {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.getProjectMetadata(true, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                should.not.exist(res.body.descriptors);
                should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                done();
            });
        });

        it('[JSON] should fetch metadata of the ' + privateProject.handle + ' project, authenticated as '+ demouser1.username  +' (creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadata(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it('[JSON] should NOT fetch metadata of the ' + privateProject.handle + ' project, authenticated as '+ demouser3.username  +' (not creator nor contributor)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.getProjectMetadata(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it('[JSON] should fetch metadata of the ' + privateProject.handle + ' project, authenticated as '+ demouser2.username  +' (contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.getProjectMetadata(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });
    });

    describe("/project/NON_EXISTENT_PROJECT?metadata (non-existant project)", function ()
    {
        it('[HTML] should give an error that the project does not exist because the project NON_EXISTENT_PROJECT does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadata(false, agent, invalidProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    //Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                    res.text.should.include("Project "  + "http://" + Config.host + "/project/" + invalidProject.handle + " not found.");
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        it('[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadata(true, agent, invalidProject.handle, function (err, res) {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);

                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(invalidProject.handle);
                    done();
                });
            });
        });
    });

    after(function (done) {
        //destroy graphs
        this.timeout(60000);
        appUtils.clearAppState(function (err, data) {
            should.equal(err, null);
            done();
        });
    });
});