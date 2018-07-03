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

const publicProject = rlequire("dendro", "test/mockdata/projects/public_project.js");
const invalidProject = rlequire("dendro", "test/mockdata/projects/invalidProject.js");

const addMetadataToFoldersUnit = rlequire("dendro", "test/units/metadata/addMetadataToFolders.Unit.js");
const db = rlequire("dendro", "test/utils/db/db.Test.js");

describe("Public project root tests", function ()
{
    this.timeout(Config.testsTimeout);
    before(function (done)
    {
        addMetadataToFoldersUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    describe("/project/" + publicProject.handle + " (default case where the root of the project is shown, without any query)", function ()
    {
        it("[HTML] should give the project page html [WITHOUT EDIT MODE] if the user is unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(false, agent, publicProject.handle, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain(publicProject.handle);
                res.text.should.not.contain("Edit mode");
                done();
            });
        });

        it("[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser1(the project creator)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.viewProject(false, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain(publicProject.handle);
                    res.text.should.contain("Edit mode");
                    done();
                });
            });
        });

        it("[HTML] should give the project page html [WITH EDIT MODE] if the user is logged in as demouser2(a project contributor)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.viewProject(false, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain(publicProject.handle);
                    res.text.should.contain("Edit mode");
                    done();
                });
            });
        });

        it("[HTML] should give the project page html [WITHOUT EDIT MODE] if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.viewProject(false, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.text.should.contain(publicProject.handle);
                    res.text.should.not.contain("Edit mode");
                    done();
                });
            });
        });

        it("[JSON] should give the project root data if the user is unauthenticated", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(true, agent, publicProject.handle, function (err, res)
            {
                res.should.have.status(200);
                res.body.descriptors.should.be.instanceof(Array);
                res.body.title.should.equal(publicProject.title);
                done();
            });
        });

        it("[JSON] should give the project root data if the user is logged in as demouser1(the project creator)", function (done)
        {
            userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
            {
                projectUtils.viewProject(true, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(publicProject.title);
                    done();
                });
            });
        });

        it("[JSON] should give the project root data if the user is logged in as demouser2(a project contributor)", function (done)
        {
            userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
            {
                projectUtils.viewProject(true, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(publicProject.title);
                    done();
                });
            });
        });

        it("[JSON] should give the project root data if the user is logged in as demouser3(non-creator or non-contributor of the project)", function (done)
        {
            userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
            {
                projectUtils.viewProject(true, agent, publicProject.handle, function (err, res)
                {
                    res.should.have.status(200);
                    res.body.descriptors.should.be.instanceof(Array);
                    res.body.title.should.equal(publicProject.title);
                    done();
                });
            });
        });
    });

    describe("/project/" + invalidProject.handle + " NON_EXISTENT PROJECT(default case where the root of the project is shown, without any query)", function ()
    {
        it("[HTML] should give the project page html with an error", function (done)
        {
            const app = global.tests.app;
            const agent = chai.request.agent(app);
            projectUtils.viewProject(false, agent, invalidProject.handle, function (err, res)
            {
                res.should.have.status(404);
                // Project http://127.0.0.1:3001/project/unknownProjectHandle not found.
                res.text.should.contain("Resource not found at uri");
                res.text.should.not.contain("Edit mode");
                done();
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
