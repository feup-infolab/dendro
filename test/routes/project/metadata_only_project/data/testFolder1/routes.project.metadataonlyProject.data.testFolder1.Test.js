const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('utils/item/itemUtils.js'));
const repositoryUtils = require(Pathfinder.absPathInTestsFolder('utils/repository/repositoryUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const metadataProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project.js'));
const invalidProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/invalidProject.js'));

const testFolder1 = require(Pathfinder.absPathInTestsFolder('mockdata/folders/testFolder1.js'));
const notFoundFolder = require(Pathfinder.absPathInTestsFolder('mockdata/folders/notFoundFolder.js'));

const addMetadataToFoldersUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/metadata/addMetadataToFolders.Unit.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));

describe('Metadata only project testFolder1 level (default case) tests', function ()
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

    describe('/project/' + metadataProject.handle + '/data/' + testFolder1.name + ' (default case where the root of the folder is shown, without any query)', function ()
    {
        it('[HTML] should refuse to give the project page html [WITHOUT EDIT MODE] if the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.viewItem(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.not.contain(metadataProject.handle);
                res.text.should.not.contain(testFolder1.name);
                res.text.should.not.contain('Edit mode');
                res.text.should.contain('Permission denied');
                done();
            });
        });

        it('[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser1(the project creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain(metadataProject.handle);
                    res.text.should.contain(testFolder1.name);
                    res.text.should.contain('Edit mode');
                    done();
                });
            });
        });

        it('[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser2(a project contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain(metadataProject.handle);
                    res.text.should.contain(testFolder1.name);
                    res.text.should.contain('Edit mode');
                    done();
                });
            });
        });

        it('[HTML] should refuse to give the project page html [WITHOUT EDIT MODE] if the user is logged in as demouser3(non-creator or non-contributor of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.not.contain(metadataProject.handle);
                    res.text.should.not.contain(testFolder1.name);
                    res.text.should.not.contain('Edit mode');
                    res.text.should.contain('Permission denied');
                    done();
                });
            });
        });

        it('[JSON] should refuse to give the project root data if the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.viewItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
            {
                res.should.have.status(401);
                should.not.exist(res.body.descriptors);
                should.not.exist(res.body.title);
                should.not.exist(res.body.hasLogicalParts);
                should.not.exist(res.body.file_extension);
                done();
            });
        });

        it('[JSON] should give the project root data if the user is logged in as demouser1(the project creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(testFolder1.name);
                    res.body.hasLogicalParts.should.be.instanceof(Array);
                    res.body.file_extension.should.equal('folder');
                    done();
                });
            });
        });

        it('[JSON] should give the project root data if the user is logged in as demouser2(a project contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(testFolder1.name);
                    res.body.hasLogicalParts.should.be.instanceof(Array);
                    res.body.file_extension.should.equal('folder');
                    done();
                });
            });
        });

        it('[JSON] should refuse to give the project root data if the user is logged in as demouser3(non-creator or non-contributor of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, metadataProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(401);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.title);
                    should.not.exist(res.body.hasLogicalParts);
                    should.not.exist(res.body.file_extension);
                    done();
                });
            });
        });

        it('[JSON] should give a not found error if the folder does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, metadataProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.should.have.status(404);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.title);
                    should.not.exist(res.body.hasLogicalParts);
                    should.not.exist(res.body.file_extension);
                    done();
                });
            });
        });
    });

    describe('/project/' + invalidProject.handle + '/data/' + testFolder1.name + ' NON_EXISTENT PROJECT(default case where the root of the folder is shown, without any query)', function ()
    {
        it('[HTML] should give the project page html with an error if the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.viewItem(false, agent, invalidProject.handle, testFolder1.name, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.not.contain(invalidProject.handle);
                res.text.should.not.contain('Edit mode');
                done();
            });
        });

        it('[HTML] should give the project page html with an error if the user is logged in as demouser1(the project creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.not.contain(invalidProject.handle);
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it('[HTML] should give the project page html with an error if the user is logged in as demouser2(a project contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.not.contain(invalidProject.handle);
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it('[HTML] should give the project page html with an error if the user is logged in as demouser3(non-creator or non-contributor of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.viewItem(false, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.not.contain(invalidProject.handle);
                    res.text.should.not.contain('Edit mode');
                    done();
                });
            });
        });

        it('[JSON] should give a 404 error if the user is unauthenticated', function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            itemUtils.viewItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
            {
                res.should.have.status(404);// -> At the moment it is responding with an html page
                done();
            });
        });

        it('[JSON] should give a 404 error if the user is logged in as demouser1(the project creator)', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(404);// -> At the moment it is responding with an html page
                    done();
                });
            });
        });

        it('[JSON] should give a 404 error if the user is logged in as demouser2(a project contributor)', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(404);// -> At the moment it is responding with an html page
                    done();
                });
            });
        });

        it('[JSON] should give a 404 error if the user is logged in as demouser3(non-creator or non-contributor of the project)', function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, invalidProject.handle, testFolder1.name, function (err, res)
                {
                    res.should.have.status(404);// -> At the moment it is responding with an html page
                    done();
                });
            });
        });

        it('[JSON] should give a not found error if the folder does not exist', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                itemUtils.viewItem(true, agent, invalidProject.handle, notFoundFolder.name, function (err, res)
                {
                    res.should.have.status(404);
                    should.not.exist(res.body.descriptors);
                    should.not.exist(res.body.title);
                    should.not.exist(res.body.hasLogicalParts);
                    should.not.exist(res.body.file_extension);
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
