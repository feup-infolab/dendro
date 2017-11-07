const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('utils/item/itemUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const metadataProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project.js'));
const invalidProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/invalidProject.js'));

const testFolder2 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/testFolder2.js'));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder('mockdata/folders/notFoundFolder.js'));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderDemoUser2'));
const createFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/folders/createFolders.Unit.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

describe('Metadata only project testFolder2 level delete tests', function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('[DELETE] [DELETE FOLDER LEVEL] [METADATA ONLY PROJECT] /project/' + metadataProject.handle + '/data/:foldername?delete', function ()
    {
        // API only

        it('Should give an error when the request is of type HTML for this route', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(false, agent, metadataProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(400);
                    res.body.message.should.equal('HTML Request not valid for this route.');
                    done();
                });
            });
        });

        it('Should give an error message when the project does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, invalidProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it('Should give an error message when the folder does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, metadataProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal('not_found');
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain('Resource not found at uri ');
                    res.body.message[0].should.contain(notFoundFolder.name);
                    res.body.message[0].should.contain(metadataProject.handle);
                    done();
                });
            });
        });

        it('Should give an error when the user is not authenticated', function (done)
        {
            // done(1);
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder2.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it('Should give a success response when the user is logged in as demouser2(a collaborator in the project with demouser1) and tries to delete a folder created by demouser1', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, metadataProject.handle, folderForDemouser2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    done();
                });
            });
        });

        it('Should give an error when the user is logged in as demouser3(nor collaborator nor creator of the project) and tries to delete the folder', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it('Should give a success response when the user is logged in as demouser1(the creator of the project) and tries to delete the folder', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.deleteItem(true, agent, metadataProject.handle, testFolder2.name, function (err, res)
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
