const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const rlequire = require("rlequire");
const Config = rlequire("dendro", "src/models/meta/config.js").Config;

const userUtils = rlequire("dendro", "test/utils/user/userUtils.js");
const ontologiesUtils = rlequire("dendro", "test/utils/ontologies/ontologiesUtils.js");

const appUtils = rlequire("dendro", "test/utils/app/appUtils.js");
const addBootUpUnit = rlequire("dendro", "test/units/bootup.Unit.js");

describe("/ontologies/all", function ()
{
    this.timeout(Config.testsTimeout);
    const demouser1 = rlequire("dendro", "test/mockdata/users/demouser1.js");
    const demouser2 = rlequire("dendro", "test/mockdata/users/demouser2.js");
    const demouser3 = rlequire("dendro", "test/mockdata/users/demouser3.js");

    before(function (done)
    {
        addBootUpUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    it("[JSON] should return all ontologies logged in as demouser1.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[3].prefix.should.contain("rdf");
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[HTML] should return all ontologies logged in as demouser1.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser1.username, demouser1.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("All Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[JSON] should return all ontologies logged in as demouser2.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[3].prefix.should.contain("rdf");
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[HTML] should return all ontologies logged in as demouser2.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("All Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[JSON] should return all ontologies logged in as demouser3.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(true, agent, function (err, res)
            {
                res.body[0].prefix.should.contain("dcterms");
                res.body[3].prefix.should.contain("rdf");
                res.should.have.status(200);
                done();
            });
        });
    });
    it("[HTML] should return all ontologies logged in as demouser3.username", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        userUtils.loginUser(demouser3.username, demouser3.password, function (err, agent)
        {
            ontologiesUtils.allDisplay(false, agent, function (err, res)
            {
                res.text.should.contain("All Descriptor Sets"); // Temporary test since page is not functional yet
                res.should.have.status(200);
                done();
            });
        });
    });

    it("[JSON] should return all ontologies not logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        ontologiesUtils.allDisplay(true, agent, function (err, res)
        {
            res.body[0].prefix.should.contain("dcterms");
            res.body[3].prefix.should.contain("rdf");
            res.should.have.status(200);
            done();
        });
    });
    it("[HTML] should return all ontologies not logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);

        ontologiesUtils.allDisplay(false, agent, function (err, res)
        {
            res.text.should.contain("All Descriptor Sets"); // Temporary test since page is not functional yet
            res.should.have.status(200);
            done();
        });
    });

    after(function (done)
    {
        appUtils.clearAppState(function (err, data)
        {
            should.equal(err, null);
            done();
        });
    });
});
