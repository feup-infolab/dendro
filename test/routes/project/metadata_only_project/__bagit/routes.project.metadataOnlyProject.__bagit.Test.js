const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const _ = require('underscore');
const md5 = require('md5');
const fs = require('fs');
const path = require('path');
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder('models/meta/config.js')).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));
const fileUtils = require(Pathfinder.absPathInTestsFolder('utils/file/fileUtils.js'));
const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const itemUtils = require(Pathfinder.absPathInTestsFolder('utils/item/itemUtils.js'));
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));
const descriptorUtils = require(Pathfinder.absPathInTestsFolder('utils/descriptor/descriptorUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1.js'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2.js'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3.js'));

const project = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project.js'));
const invalidProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/invalidProject.js'));

const createFilesUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/files/createFiles.Unit.js'));

describe('Backup Metadata Only project', function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createFilesUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe('[METADATA ONLY PROJECT] [Invalid Cases] /project/' + project.handle + '?bagit', function ()
    {
        it('Should give an error message when a project does not exist', function (done)
        {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.bagit(agent, invalidProject.handle, function (err, res)
                {
                    res.statusCode.should.equal(404);
                    done();
                });
            });
        });

        it('Should give an error when the user is not authenticated', function (done)
        {
            this.timeout(Config.testsTimeout);
            const app = global.tests.app;
            const agent = chai.request.agent(app);

            projectUtils.bagit(agent, project.handle, function (err, res)
            {
                should.not.equal(err, null);
                res.statusCode.should.equal(401);
                done();
            });
        });

        it('Should give an error when the user is authenticated, but not as a creator nor contributor of the project', function (done)
        {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                should.equal(err, null);
                projectUtils.bagit(agent, project.handle, function (err, res)
                {
                    res.statusCode.should.equal(401);
                    done();
                });
            });
        });
    });

    describe('[METADATA ONLY PROJECT] [Valid Cases] /project/' + project.handle + '?bagit', function ()
    {
        it('Should backup the private project correctly', function (done)
        {
            this.timeout(Config.testsTimeout);
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.bagit(agent, project.handle, function (err, res)
                {
                    should.equal(err, null);
                    res.statusCode.should.equal(200);
                    projectUtils.contentsMatchBackup(project, res.body, function (err, result)
                    {
                        should.equal(err, null);
                        projectUtils.metadataMatchesBackup(project, res.body, function (err, result)
                        {
                            should.equal(err, null);
                            done();
                        });
                    });
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
