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

const privateProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project.js'));
const invalidProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/invalidProject.js'));

const testFolder2 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/testFolder2.js'));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder('mockdata/folders/notFoundFolder.js'));
const folderForDemouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folderDemoUser2'));
const addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/metadata/addMetadataToFolders.Unit.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

describe('Private project testFolder2 level ?change_log', function ()
{
    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        addMetadataToFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('[GET] [PRIVATE PROJECT] /project/' + privateProject.handle + '/data/foldername?change_log', function ()
    {
        it('Should give an error if the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            itemUtils.getItemChangeLog(true, agent, privateProject.handle, testFolder2.name, function (err, res)
            {
                res.statusCode.should.equal(401);
                done();
            });
        });

        it('Should give an error if the project does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemChangeLog(true, agent, invalidProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal('not_found');
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain('Resource not found at uri ');
                    res.body.message[0].should.contain(testFolder2.name);
                    res.body.message[0].should.contain(invalidProject.handle);
                    done();
                });
            });
        });

        it('Should give an error if the folder identified by foldername does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemChangeLog(true, agent, privateProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    res.body.result.should.equal('not_found');
                    res.body.message.should.be.an('array');
                    res.body.message.length.should.equal(1);
                    res.body.message[0].should.contain('Resource not found at uri ');
                    res.body.message[0].should.contain(notFoundFolder.name);
                    res.body.message[0].should.contain(privateProject.handle);
                    done();
                });
            });
        });

        it('Should an error if the user is logged in as demouser3(not a collaborator nor creator of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.getItemChangeLog(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });

        it('Should give the change log related to the folder if the folder exists and if the user is logged in as demouser1(the creator of the project)', function (done)
        {
            // jsonOnly, agent, projectHandle, itemPath, cb
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.getItemChangeLog(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
                    done();
                });
            });
        });

        it('Should give the change log related to the folder if the folder exists and if the user is logged in as demouser2(a collaborator on the project)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.getItemChangeLog(true, agent, privateProject.handle, testFolder2.name, function (err, res)
                {
                    res.statusCode.should.equal(200);
                    res.body[0].changes.length.should.equal(3);// The abstract, title and creator descriptors
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
