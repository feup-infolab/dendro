const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));
const ontologiesUtils = require(Pathfinder.absPathInTestsFolder("utils/ontologies/ontologiesUtils.js"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const addBootUpUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/bootup.Unit.js"));

describe("/ontologies/public", function ()
{
    const demouser1 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser1.js"));
    const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
    const demouser3 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser3.js"));

    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        addBootUpUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    it("[JSON] should return public ontologies logged in as demouser1.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[0].prefix.should.not.contain("nie");
                res.should.have.status(200);
                done();
            });
        });
    });

    it("[HTML] should return public ontologies logged in as demouser1.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("Public Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[JSON] should return public ontologies logged in as demouser2.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[0].prefix.should.not.contain("nie");
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[HTML] should return public ontologies logged in as demouser2.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("Public Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });

    it("[JSON] should return public ontologies logged in as demouser3.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[0].prefix.should.not.contain("nie");
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[HTML] should return public ontologies logged in as demouser3.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            ontologiesUtils.publicDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("Public Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });

    it("[JSON] should return public ontologies not logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        ontologiesUtils.publicDisplay(true, agent, function (err, res)
        {
            res.body[0].prefix.should.contain("dcterms");
            res.body[0].prefix.should.not.contain("nie");
            res.should.have.status(200);
            done();
        });
    });

    it("[HTML] should return public ontologies not logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        ontologiesUtils.publicDisplay(false, agent, function (err, res)
        {
            res.text.should.contain("Public Descriptor Sets"); // Temporary test since page is not functional yet
            res.should.have.status(200);
            done();
        });
    });

    after(function (done)
    {
        this.timeout(Config.testsTimeout);
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
