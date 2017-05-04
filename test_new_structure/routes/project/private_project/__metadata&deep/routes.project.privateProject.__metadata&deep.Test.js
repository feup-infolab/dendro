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

describe("Private project level metadata&deep tests", function () {
    before(function (done) {
        this.timeout(60000);
        addMetadataToFoldersUnit.setup(function (err, results) {
            should.equal(err, null);
            done();
        });
    });

    describe(privateProject.handle+"?metadata&deep (private project)", function ()
    {
        /**
         * Invalid request type
         */
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(false, agent, privateProject.handle, function (err, res) {
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
        it('[JSON] should NOT fetch metadata recursively of the' + privateProject.handle + ' project without authenticating', function (done)
        {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.getProjectMetadataDeep(true, agent, privateProject.handle, function (err, res) {
                res.statusCode.should.equal(401);
                should.not.exist(res.body.descriptors);
                should.not.exist(res.body.hasLogicalParts);
                done();
            });
        });

        it('[JSON] should fetch metadata recursively of the ' + privateProject.handle + ' project, authenticated as '+ demouser1.username +' (creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.hasLogicalParts.should.be.instanceof(Array);//only because this is a metadata&deep request
                    done();
                });
            });
        });

        it('[JSON] should NOT fetch metadata recursively of the ' + privateProject.handle + ' project, authenticated as '+ demouser3.username +' (not user nor contributor)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(401);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);
                    done();
                });
            });
        });

        it('[JSON] should fetch metadata of the ' + privateProject.handle + ' project, authenticated as '+ demouser2.username  +' (contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(true, agent, privateProject.handle, function (err, res) {
                    res.statusCode.should.equal(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.hasLogicalParts.should.be.instanceof(Array);//only because this is a metadata&deep request
                    done();
                });
            });
        });
    });

    describe(invalidProject.handle+"?metadata&deep (non-existant project)", function ()
    {
        it('[HTML] should refuse request if Accept application/json was not specified', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(false, agent, invalidProject.handle, function (err, res) {
                    res.statusCode.should.equal(400);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);
                    done();
                });
            });
        });

        it('[JSON] should give a 404 because the project NON_EXISTENT_PROJECT does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent) {
                projectUtils.getProjectMetadataDeep(true, agent, invalidProject.handle, function (err, res) {
                    res.statusCode.should.equal(404);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.hasLogicalParts);
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