process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const fs = require('fs');
const path = require('path');
const async = require('async');
const Config = global.Config;

const should = chai.should();
const appUtils = require(Pathfinder.absPathInTestsFolder('utils/app/appUtils.js'));

const publicProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/public_project.js'));
const metadataOnlyProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/metadata_only_project.js'));
const privateProject = require(Pathfinder.absPathInTestsFolder('mockdata/projects/private_project.js'));

const md5File = require('md5-file');

const projectUtils = require(Pathfinder.absPathInTestsFolder('utils/project/projectUtils.js'));
const userUtils = require(Pathfinder.absPathInTestsFolder('utils/user/userUtils.js'));

const demouser1 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser1'));
const demouser2 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser2'));
const demouser3 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser3'));
const demouser4 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser4'));
const demouser5 = require(Pathfinder.absPathInTestsFolder('mockdata/users/demouser5'));

const folder = require(Pathfinder.absPathInTestsFolder('mockdata/folders/folder.js'));
const db = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('utils/db/db.Test.js'));
const createProjectsUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder('units/projects/createProjects.Unit.js'));

const Project = require(Pathfinder.absPathInSrcFolder('models/project.js')).Project;
const User = require(Pathfinder.absPathInSrcFolder('/models/user.js')).User;

function requireUncached (module)
{
    delete require.cache[require.resolve(module)];
    return require(module);
}

describe('Administer projects', function (done)
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        createProjectsUnit.setup(function (err, res)
        {
            should.equal(err, null);
            done();
        });
    });
    describe('project/' + publicProject.handle + '?administer', function ()
    {
        it('[HTML] should not access project without logging in GET', function (done)
        {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.administer(agent, false, {}, publicProject.handle, function (err, res)
            {
                /* res.should.have.status(200); */
                res.should.have.status(401);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });

        it('[HTML] should not access project without admin rights GET', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.administer(agent, false, {}, publicProject.handle, function (err, res)
                {
                    /* res.should.have.status(200); */
                    res.should.have.status(401);
                    res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                    done();
                });
            });
        });

        it("[HTML] should access project's info GET", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                //
                // SELECT *
                // FROM
                // <http://127.0.0.1:3001/dendro_graph>
                // WHERE
                // {
                // <http://127.0.0.1:3001/project/publicprojectcreatedbydemouser1> ?p ?o
                //     }
                projectUtils.administer(agent, false, {}, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain('Editing project "' + publicProject.title + '"');
                    done();
                });
            });
        });

        it('[HTML] should not access admin in folder GET', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.administer(agent, false, {}, privateProject.handle + '/data/pastinhaLinda', function (err, res)
                {
                    res.should.have.status(404);
                    should.exist(err);
                    err.message.should.equal('Not Found');
                    done();
                });
            });
        });

        it('[HTML] should not access admin in folder POST', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.administer(agent, true, {}, privateProject.handle + '/data/pastinhaLinda', function (err, res)
                {
                    res.should.have.status(404);
                    should.exist(err);
                    err.message.should.equal('Not Found');
                    done();
                });
            });
        });

        it('[HTML] should not modify project without logging in POST', function (done)
        {
            var app = GLOBAL.tests.app;
            var agent = chai.request.agent(app);
            projectUtils.administer(agent, true, {}, publicProject.handle, function (err, res)
            {
                /* res.should.have.status(200); */
                res.should.have.status(401);
                res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                done();
            });
        });

        it('[HTML] should not modify project without admin rights POST', function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.administer(agent, true, {}, publicProject.handle, function (err, res)
                {
                    /* res.should.have.status(200); */
                    res.should.have.status(401);
                    res.text.should.contain('Permission denied : cannot access the administration area of the project because you are not its creator.');
                    done();
                });
            });
        });

        it("[HTML] should change project's privacy status, title and description", function (done)
        {
            var metadata = 'metadata_only';
            var title = 'mockTitle';
            var description = 'this is a testing description with no other purposes';
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.administer(agent, true, {privacy: metadata, title: title, description: description}, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    Project.findByHandle(publicProject.handle, function (err, project)
                    {
                        project.ddr.privacyStatus.should.equal(metadata);
                        project.dcterms.title.should.equal(title);
                        project.dcterms.description.should.equal(description);
                        done();
                    });
                });
            });
        });

        it('[HTML] add non-existent contributors', function (done)
        {
            var invalidUsername = 'nonexistinguser';
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.administer(agent, true, {contributors: [invalidUsername]}, publicProject.handle, function (err, res)
                {
                    /* res.should.have.status(200); */
                    res.should.have.status(400);
                    res.text.should.contain('error_messages');
                    res.text.should.contain(invalidUsername);
                    done();
                });
            });
        });

        it('[HTML] add contributors', function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                User.findByUsername(demouser3.username, function (err, demouser3object)
                {
                    Project.findByHandle(publicProject.handle, function (err, project)
                    {
                        should.not.exist(project.dcterms.contributor);
                        projectUtils.administer(agent, true, {contributors: [demouser3object.uri, demouser4.username, demouser5.username ]}, publicProject.handle, function (err, res)
                        {
                            should.equal(err, null);
                            res.should.have.status(200);
                            Project.findByHandle(publicProject.handle, function (err, project)
                            {
                                var contributors = project.dcterms.contributor;
                                contributors.length.should.equal(3);

                                async.mapSeries([demouser3.username, demouser4.username, demouser5.username], function (username, callback)
                                {
                                    User.findByUsername(username, callback);
                                }, function (err, users)
                                {
                                    should.not.exist(err);

                                    const demouser3uri = users[0].uri;
                                    const demouser4uri = users[1].uri;
                                    const demouser5uri = users[2].uri;

                                    contributors.should.contain(demouser3uri);
                                    contributors.should.contain(demouser4uri);
                                    contributors.should.contain(demouser5uri);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it('[HTML] remove contributors', function (done)
        {
            User.findByUsername(demouser2.username, function (err, user)
            {
                should.not.exist(err);

                userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
                {
                    Project.findByHandle(publicProject.handle, function (err, project)
                    {
                        project.dcterms.contributor.should.be.instanceof(Array);
                        project.dcterms.contributor.length.should.equal(3);
                        projectUtils.administer(agent, true, {contributors: [demouser2.username, demouser3.username]}, publicProject.handle, function (err, res)
                        {
                            Project.findByHandle(publicProject.handle, function (err, project)
                            {
                                should.not.exist(err);
                                project.dcterms.contributor.should.be.instanceof(Array);
                                project.dcterms.contributor.length.should.equal(2);

                                projectUtils.administer(agent, true, {contributors: [demouser2.username]}, publicProject.handle, function (err, res)
                                {
                                    should.not.exist(err);
                                    Project.findByHandle(publicProject.handle, function (err, project)
                                    {
                                        should.not.exist(err);
                                        project.dcterms.contributor.should.equal(user.uri);
                                        done();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    after(function (done)
    {
    // destroy graphs
        this.timeout(Config.testsTimeout);
        db.deleteGraphs(function (err, data)
        {
            should.equal(err, null);
            GLOBAL.tests.server.close();
            done();
        });
    });
});
