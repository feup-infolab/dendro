const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const _ = require("underscore");
chai.use(chaiHttp);

const Pathfinder = global.Pathfinder;
const Config = require(Pathfinder.absPathInSrcFolder("models/meta/config.js")).Config;

const userUtils = require(Pathfinder.absPathInTestsFolder("utils/user/userUtils.js"));

const appUtils = require(Pathfinder.absPathInTestsFolder("utils/app/appUtils.js"));
const createUserUnit = appUtils.requireUncached(Pathfinder.absPathInTestsFolder("units/users/createUsers.Unit.js"));

describe("/user/demouser2", function (done)
{
    const demouser2 = require(Pathfinder.absPathInTestsFolder("mockdata/users/demouser2.js"));
    const falseUser = "demouser404";

    before(function (done)
    {
        this.timeout(Config.testsTimeout);
        createUserUnit.setup(function (err, results)
        {
            should.equal(err, null);
            done();
        });
    });

    it("[JSON] should NOT access demouser2.username profile when given demouser2.username and NOT logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
        {
            res.should.have.status(401);
            JSON.parse(res.text).message.should.equal("Permission denied : cannot get information of the user because you are not logged in.");
            done();
        });
    });

    it("[HTML] should NOT access demouser2.username profile when given demouser2.username and  NOT logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(demouser2.username, false, agent, function (err, res)
        {
            res.should.have.status(401);
            res.text.should.contain("Permission denied : cannot get information of the user because you are not logged in.");
            done();
        });
    });
    // review agent immediatly
    it("[JSON] should access demouser2.username profile when given demouser2.username and logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.getUserInfo(demouser2.username, true, agent, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("\"username\":\"demouser2\"");
                done();
            });
        });
    });

    it("[HTML] should access demouser2.username profile when given demouser2.username and logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.getUserInfo(demouser2.username, false, agent, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("Viewing user Dendro 2 Demo User 2");
                done();
            });
        });
    });

    it("[JSON] should NOT access demouser2.username profile when given non-existent username and logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.getUserInfo(falseUser, true, agent, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("demouser404 does not exist");
                done();
            });
        });
    });

    it("[HTML] should NOT access demouser2.username profile when given non-existent username and logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.getUserInfo(falseUser, false, agent, function (err, res)
            {
                res.should.have.status(200);
                res.text.should.contain("demouser404 does not exist");
                done();
            });
        });
    });

    it("[JSON] should NOT access demouser2.username profile when given non-existent username and NOT logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, true, agent, function (err, res)
        {
            res.should.have.status(401);
            JSON.parse(res.text).message.should.equal("Permission denied : cannot get information of the user because you are not logged in.");
            done();
        });
    });

    it("[HTML] should NOT access demouser2.username profile when given non-existent username and NOT logged in", function (done)
    {
        const app = global.tests.app;
        const agent = chai.request.agent(app);
        userUtils.getUserInfo(falseUser, false, agent, function (err, res)
        {
            res.should.have.status(401);
            res.text.should.contain("Permission denied : cannot get information of the user because you are not logged in.");
            done();
        });
    });

    it("Should not provide private information about the user via API", function (done)
    {
        userUtils.loginUser(demouser2.username, demouser2.password, function (err, agent)
        {
            userUtils.getUserInfo(demouser2.username, true, agent, function (err, data)
            {
                if (data.body.ddr.password)
                {
                    done(1);
                }
                else
                {
                    done();
                }
            });
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
