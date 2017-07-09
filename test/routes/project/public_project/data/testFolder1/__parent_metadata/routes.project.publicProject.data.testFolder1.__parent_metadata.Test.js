const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Config = global.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const repositoryUtils = require(Config.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder1 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder1.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));

const addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
const db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Public project testFolder1 level parent_metadata tests", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe("/project/"+publicProject.handle + "/data/" + testFolder1.name +"?parent_metadata (public project)", function ()
    {
        /**
         * Invalid request type
         */
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemParentMetadata(false, agent, publicProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);
                    done();
                });
            });
        });

        /**
         * Valid request type
         */
        it("[JSON] should fetch the parent_metadata of the " + publicProject.handle  + "/data/" + testFolder1.name+ " resource without authenticating", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.getItemParentMetadata(true, agent, publicProject.handle, testFolder1.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.should.be.instanceof(Array);
                done();
            });
        });

        it("[JSON] should fetch the parent_metadata of the " + publicProject.handle  + "/data/" + testFolder1.name+ " resource, authenticated as "+ demouser1.username +" (creator)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemParentMetadata(true, agent, publicProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should fetch the parent_metadata of the " + publicProject.handle  + "/data/" + testFolder1.name+ " resource, authenticated as "+ demouser3.username +" (not creator nor contributor)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.getItemParentMetadata(true, agent, publicProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it("[JSON] should fetch the parent_metadata of the " + publicProject.handle  + "/data/" + testFolder1.name+ " resource, authenticated as "+ demouser2.username  +" (contributor)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.getItemParentMetadata(true, agent, publicProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });
    });

    describe(publicProject.handle + "/data/" + testFolder1.name +"?parent_metadata (non-existant project)", function ()
    {
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemParentMetadata(false, agent, publicProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it('[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemParentMetadata(true, agent, invalidProject.handle, testFolder1.name, function (err, res) {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);

                    res.body.result.should.equal("not_found");
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain("Resource not found at uri ");
                    res.body.message[0].should.contain(testFolder1.name);
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