var chai = require('chai');
var chaiHttp = require('chai-http');
const should = chai.should();
var _ = require('underscore');
chai.use(chaiHttp);

const Config = GLOBAL.Config;

const userUtils = require(Config.absPathInTestsFolder("utils/user/userUtils.js"));
const itemUtils = require(Config.absPathInTestsFolder("utils/item/itemUtils.js"));
const repositoryUtils = require(Config.absPathInTestsFolder("utils/repository/repositoryUtils.js"));
const appUtils = require(Config.absPathInTestsFolder("utils/app/appUtils.js"));

const demouser1 = require(Config.absPathInTestsFolder("mockdata/users/demouser1.js"));
const demouser2 = require(Config.absPathInTestsFolder("mockdata/users/demouser2.js"));
const demouser3 = require(Config.absPathInTestsFolder("mockdata/users/demouser3.js"));

const publicProject = require(Config.absPathInTestsFolder("mockdata/projects/public_project.js"));
const invalidProject = require(Config.absPathInTestsFolder("mockdata/projects/invalidProject.js"));

const testFolder2 = require(Config.absPathInTestsFolder("mockdata/folders/testFolder2.js"));
const notFoundFolder = require(Config.absPathInTestsFolder("mockdata/folders/notFoundFolder.js"));

var addMetadataToFoldersUnit = appUtils.requireUncached(Config.absPathInTestsFolder("units/metadata/addMetadataToFolders.Unit.js"));
var db = appUtils.requireUncached(Config.absPathInTestsFolder("utils/db/db.Test.js"));

describe("Public project testFolder2 level metadata tests", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe(publicProject.handle+ "/data/" + testFolder2.name +"?metadata (public project)", function ()
    {
        /**
         * Invalid request type
         */
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemMetadata(false, agent, publicProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("HTML Request not valid for this route.");
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);//The hasLogicalParts array in the body response should only be present in the metadata&deep request
                    done();
                });
            });
        });

        /**
         * Valid request type
         */
        it('[JSON] should fetch metadata of the ' + publicProject.handle + "/data/" + testFolder2.name +' folder without authenticating', function (done)
        {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            itemUtils.getItemMetadata(true, agent, publicProject.handle, testFolder2.name, function (err, res) {
                res.statusCode.should.equal(200);
                res.body.descriptors.should.be.instanceof(Array);
                done();
            });
        });

        it('[JSON] should fetch metadata of the ' + publicProject.handle + "/data/" + testFolder2.name+ ' folder, authenticated as '+ demouser1.username  +' (creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemMetadata(true, agent, publicProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it('[JSON] should fetch metadata of the ' + publicProject.handle + "/data/" + testFolder2.name+ ' folder, authenticated as '+ demouser3.username  +' (not creator nor contributor)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                itemUtils.getItemMetadata(true, agent, publicProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });

        it('[JSON] should fetch metadata of the ' + publicProject.handle + "/data/" + testFolder2.name+ ' folder, authenticated as '+ demouser2.username  +' (contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                itemUtils.getItemMetadata(true, agent, publicProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    done();
                });
            });
        });
    });

    describe("/project/NON_EXISTENT_PROJECT" + "/data/" + testFolder2.name + "?metadata (non-existant project)", function ()
    {
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemMetadata(false, agent, invalidProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal("HTML Request not valid for this route.");
                    should.not.exist(res.body.descriptors);
                    done();
                });
            });
        });

        it('[JSON] should give a 500 because the project NON_EXISTENT_PROJECT does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                itemUtils.getItemMetadata(true, agent, invalidProject.handle, testFolder2.name, function (err, res) {
                    res.statusCode.should.equal(500);
                    should.not.exist(res.body.descriptors);
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